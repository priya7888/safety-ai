import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  MapPin, 
  Navigation, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Users, 
  Search, 
  RefreshCw, 
  Filter, 
  Compass, 
  Layers, 
  ExternalLink,
  Flame,
  ArrowRight,
  Radio,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { getRiskMarkerIcon } from './maps/mapUtils';
import AdminNavigationModal from './maps/AdminNavigationModal';

export default function IncidentRadarMapView({ onNavigate }) {
  const { user } = useAuth();
  const isAdmin = Boolean(
    user?.is_admin || 
    user?.role === 'ADMINISTRATOR' || 
    user?.role_name === 'Administrator' || 
    (user?.email && user.email.toLowerCase().includes('admin'))
  );

  const [incidents, setIncidents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState('map'); // 'map' or 'team'
  const [navigatingIncident, setNavigatingIncident] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

  // Load incidents from API (scoped automatically by user/admin role)
  const loadIncidents = async () => {
    setIsLoading(true);
    try {
      const data = await api.getMapIncidents();
      setIncidents(data || []);
      if (data && data.length > 0 && !selectedIncident) {
        setSelectedIncident(data[0]);
      }
    } catch (err) {
      console.error('Failed to load map incidents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load all platform users to identify admin's 10 team members
  useEffect(() => {
    loadIncidents();

    if (isAdmin && user?.id) {
      api.getUsers().then(users => {
        if (Array.isArray(users)) {
          const myWorkers = users.filter(u => u.assigned_admin_id === user.id || (u.zone && u.zone === user.zone && !u.is_admin));
          setTeamMembers(myWorkers);
        }
      }).catch(console.error);
    }
  }, [user]);

  // Filtered incidents
  const filteredIncidents = incidents.filter(inc => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query || 
      (inc.description || '').toLowerCase().includes(query) ||
      (inc.location || '').toLowerCase().includes(query) ||
      (inc.incident_location_name || '').toLowerCase().includes(query) ||
      (inc.reporter_name || '').toLowerCase().includes(query) ||
      (inc.identified_hazard || '').toLowerCase().includes(query);

    const score = inc.ai_score || (inc.sif_precursor_assessment === 'YES' ? 85 : 45);
    const riskCategory = score > 66 ? 'HIGH' : score >= 33 ? 'MEDIUM' : 'LOW';
    const matchesRisk = riskFilter === 'ALL' || riskFilter === riskCategory;

    return matchesSearch && matchesRisk;
  });

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const defaultCenter = [27.395, 95.635];
      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 14,
        zoomControl: false
      });
      mapInstanceRef.current = map;

      L.control.zoom({ position: 'topright' }).addTo(map);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
    }

    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!markersGroup) return;

    markersGroup.clearLayers();

    const bounds = [];

    filteredIncidents.forEach(inc => {
      const lat = inc.incident_latitude;
      const lng = inc.incident_longitude;
      if (lat == null || lng == null) return;

      bounds.push([lat, lng]);

      const score = inc.ai_score || (inc.sif_precursor_assessment === 'YES' ? 85 : 40);
      const isSelected = selectedIncident && selectedIncident.id === inc.id;

      const marker = L.marker([lat, lng], {
        icon: getRiskMarkerIcon(score, isSelected)
      }).addTo(markersGroup);

      const color = score > 66 ? '#EF4444' : score >= 33 ? '#2563EB' : '#10B981';
      const riskLabel = score > 66 ? 'CRITICAL / HIGH' : score >= 33 ? 'MEDIUM RISK' : 'LOW RISK';

      const popupHtml = `
        <div style="font-family: system-ui, sans-serif; min-width: 240px; padding: 4px;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid ${color}; padding-bottom: 6px; margin-bottom: 8px;">
            <strong style="color: #0f172a; font-size: 13px; text-transform: uppercase;">
              ${inc.report_reference}
            </strong>
            <span style="background: ${color}; color: white; padding: 2px 8px; border-radius: 6px; font-weight: 800; font-size: 11px;">
              ${score} / 100
            </span>
          </div>
          <div style="font-size: 12px; color: #334155; line-height: 1.5; margin-bottom: 6px;">
            <div style="font-weight: 700; color: #0f172a; margin-bottom: 2px;">
              ${inc.incident_location_name || inc.location}
            </div>
            <div style="color: #64748b; font-size: 11px;">
              Reported by: <strong>${inc.reporter_name || 'Assigned Field Worker'}</strong>
            </div>
            <div style="color: #64748b; font-size: 11px;">
              Hazard: <span style="color: ${color}; font-weight: 700;">${inc.identified_hazard || inc.report_type}</span>
            </div>
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px; font-size: 11px; color: #475569; margin-bottom: 8px;">
            ${(inc.description || '').slice(0, 95)}...
          </div>
          ${isAdmin ? `
            <button 
              id="popup-nav-btn-${inc.id}" 
              style="width: 100%; background: #FF5A36; color: white; border: none; padding: 6px 12px; border-radius: 8px; font-weight: 700; font-size: 11px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;"
            >
              🧭 Navigate to Incident
            </button>
          ` : `
            <div style="font-size: 10px; color: #64748b; text-align: center; font-family: monospace;">
              📍 Your Verified Observation Point
            </div>
          `}
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('popupopen', () => {
        setSelectedIncident(inc);
        if (isAdmin) {
          const btn = document.getElementById(`popup-nav-btn-${inc.id}`);
          if (btn) {
            btn.onclick = () => setNavigatingIncident(inc);
          }
        }
      });
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  }, [filteredIncidents, selectedIncident, isAdmin]);

  const handleSelectIncident = (inc) => {
    setSelectedIncident(inc);
    if (mapInstanceRef.current && inc.incident_latitude && inc.incident_longitude) {
      mapInstanceRef.current.flyTo([inc.incident_latitude, inc.incident_longitude], 16, {
        duration: 1.2
      });
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      
      {/* 1. Header Banner with Role and Jurisdiction Context */}
      <div className="bg-gradient-to-r from-slate-900 via-[#0B1327] to-slate-900 border border-slate-800 rounded-2xl p-5 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B4A] to-[#FF5A36] text-white flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black tracking-tight text-white font-heading">
                  {isAdmin ? 'Zone Safety Radar & Emergency Navigation' : 'My Field Observations & Location Map'}
                </h1>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider font-mono ${
                  isAdmin ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {isAdmin ? 'Supervisor Radar' : 'Worker Scoped View'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {isAdmin ? (
                  <>
                    Supervising: <span className="text-white font-bold">{user?.zone || 'Operating Division'}</span> • Allocated: <strong className="text-orange-400">10 Field Workers</strong>
                  </>
                ) : (
                  <>
                    Logged in as: <strong className="text-white">{user?.full_name}</strong> • Supervisor: <span className="text-orange-400 font-bold">{user?.assigned_admin_name || 'HSE Zone Lead'}</span>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & Reload */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          {isAdmin && (
            <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 text-xs">
              <button
                onClick={() => setActiveTab('map')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'map' ? 'bg-[#FF5A36] text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Incident Map</span>
              </button>
              <button
                onClick={() => setActiveTab('team')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'team' ? 'bg-[#FF5A36] text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Team Roster (10)</span>
              </button>
            </div>
          )}

          <button
            onClick={loadIncidents}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition-all cursor-pointer shadow-xs"
            title="Refresh radar telemetry"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-orange-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Team Roster View (For Admins) */}
      {isAdmin && activeTab === 'team' ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 font-heading flex items-center gap-2">
                <Users className="w-4 h-4 text-[#FF5A36]" />
                <span>Allocated Team Members ({teamMembers.length} Workers)</span>
              </h2>
              <p className="text-xs text-slate-500">
                All hazard observations submitted by these personnel route directly to your supervisor dashboard and radar map.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(teamMembers.length > 0 ? teamMembers : Array.from({ length: 10 }).map((_, i) => ({
              id: i + 1,
              full_name: `Field Tech ${String(i + 1).padStart(2, '0')} (${user?.zone || 'Ops'})`,
              email: `worker${i + 1}@gmail.com`,
              zone: user?.zone || 'Facility Ground',
              role: 'NORMAL_USER'
            }))).map((worker, idx) => {
              const workerIncidentCount = incidents.filter(inc => inc.user_id === worker.id || inc.reporter_email === worker.email).length;
              return (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 hover:border-orange-300 transition-all flex items-center justify-between shadow-2xs">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>{worker.full_name}</span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-500">{worker.email}</div>
                    <div className="text-[10px] text-slate-400">Assigned Zone: {worker.zone || user?.zone}</div>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white border border-slate-200 text-slate-700">
                      {workerIncidentCount} {workerIncidentCount === 1 ? 'Report' : 'Reports'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* 3. Main Map & Incidents Split View */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Left Column: Interactive Map (8 Cols) */}
          <div className="lg:col-span-8 space-y-3">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs relative">
              
              {/* Map Canvas */}
              <div 
                ref={mapContainerRef} 
                className="w-full h-[520px] sm:h-[580px] z-0" 
                style={{ background: '#0F172A' }}
              />

              {/* Map Legend Overlay */}
              <div className="absolute bottom-4 left-4 z-1000 bg-white/95 backdrop-blur-md p-3 rounded-xl border border-slate-200 shadow-md flex items-center gap-4 text-xs">
                <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Risk Level:</span>
                <div className="flex items-center gap-1.5 font-bold text-rose-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  <span>High (&gt;66)</span>
                </div>
                <div className="flex items-center gap-1.5 font-bold text-blue-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  <span>Medium (33–66)</span>
                </div>
                <div className="flex items-center gap-1.5 font-bold text-emerald-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span>Low (&lt;33)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Scoped Incident Cards & Quick Navigation (4 Cols) */}
          <div className="lg:col-span-4 space-y-3 flex flex-col h-[520px] sm:h-[580px]">
            
            {/* Filter / Search Bar */}
            <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by hazard, location..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden focus:border-orange-500 font-medium"
                />
              </div>

              {/* Risk Pills */}
              <div className="flex gap-1 text-[11px]">
                {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map(f => (
                  <button
                    key={f}
                    onClick={() => setRiskFilter(f)}
                    className={`flex-1 py-1 rounded-lg font-bold text-center transition-all cursor-pointer ${
                      riskFilter === f 
                        ? 'bg-slate-900 text-white shadow-xs' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Incident Cards Scrollable List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {filteredIncidents.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-2 text-slate-500">
                  <MapPin className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-semibold">No geocoded incidents found in this scope.</p>
                </div>
              ) : (
                filteredIncidents.map(inc => {
                  const score = inc.ai_score || (inc.sif_precursor_assessment === 'YES' ? 85 : 40);
                  const isSelected = selectedIncident?.id === inc.id;
                  const isHigh = score > 66;

                  return (
                    <div
                      key={inc.id}
                      onClick={() => handleSelectIncident(inc)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 shadow-2xs ${
                        isSelected 
                          ? 'bg-orange-50/90 border-[#FF5A36] ring-1 ring-[#FF5A36]' 
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono font-bold text-slate-600">
                          {inc.report_reference}
                        </span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full font-mono ${
                          isHigh 
                            ? 'bg-rose-100 text-rose-700 border border-rose-200' 
                            : score >= 33 
                            ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                            : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        }`}>
                          SCORE {score}
                        </span>
                      </div>

                      <div className="text-xs font-bold text-slate-900 line-clamp-1">
                        {inc.incident_location_name || inc.location}
                      </div>

                      <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                        {inc.description}
                      </p>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                        <span>Reported by: <strong className="text-slate-800">{inc.reporter_name || 'Field Worker'}</strong></span>
                        
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setNavigatingIncident(inc);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-[#FF5A36] hover:bg-[#E04826] text-white font-bold flex items-center gap-1 transition-all shadow-xs cursor-pointer"
                          >
                            <Navigation className="w-3 h-3" />
                            <span>Navigate</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>

        </div>
      )}

      {/* 4. Turn-by-Turn Admin Navigation Modal */}
      {navigatingIncident && (
        <AdminNavigationModal
          isOpen={Boolean(navigatingIncident)}
          onClose={() => setNavigatingIncident(null)}
          incidentLocation={{
            latitude: navigatingIncident.incident_latitude,
            longitude: navigatingIncident.incident_longitude,
            name: navigatingIncident.incident_location_name || navigatingIncident.location,
            address: navigatingIncident.incident_address
          }}
          riskScore={navigatingIncident.ai_score || 80}
          riskLevel={navigatingIncident.ai_score > 66 ? 'Critical Risk' : 'Medium Risk'}
          incidentType={navigatingIncident.report_type || 'Safety Observation'}
        />
      )}

    </div>
  );
}
