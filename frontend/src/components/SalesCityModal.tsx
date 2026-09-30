import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  ChevronRight, 
  ArrowLeft, 
  Search, 
  MapPin, 
  Store, 
  Phone, 
  User, 
  Activity,
  Car
} from 'lucide-react';
import type { StateData, CityData, ShowroomData } from '../types/salesCity';

interface SalesCityModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataset: StateData[];
  selectedState: StateData | null;
  selectedCity: CityData | null;
  selectedShowroom: ShowroomData | null;
  onSelectShowroom: (state: StateData, city: CityData, showroom: ShowroomData) => void;
  onSelectCityOnly: (state: StateData, city: CityData) => void;
  onClearSelection: () => void;
}

export const SalesCityModal: React.FC<SalesCityModalProps> = ({
  isOpen,
  onClose,
  dataset,
  selectedState: initialSelectedState,
  selectedCity: initialSelectedCity,
  selectedShowroom: initialSelectedShowroom,
  onSelectShowroom,
  onSelectCityOnly,
  onClearSelection
}) => {
  const [level, setLevel] = useState<1 | 2 | 3>(1);
  const [activeState, setActiveState] = useState<StateData | null>(null);
  const [activeCity, setActiveCity] = useState<CityData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);

  // Sync internal drill-down navigation state when opened
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      if (initialSelectedShowroom && initialSelectedCity && initialSelectedState) {
        setActiveState(initialSelectedState);
        setActiveCity(initialSelectedCity);
        setLevel(3);
      } else if (initialSelectedCity && initialSelectedState) {
        setActiveState(initialSelectedState);
        setActiveCity(initialSelectedCity);
        setLevel(2);
      } else {
        setLevel(1);
        setActiveState(null);
        setActiveCity(null);
      }
    }
  }, [isOpen, initialSelectedState, initialSelectedCity, initialSelectedShowroom]);

  // Handle escape key and click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filtered lists
  const filteredStates = dataset.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCities = (activeState?.cities || []).filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredShowrooms = (activeCity?.showrooms || []).filter(sh =>
    sh.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sh.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sh.manager.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStateClick = (state: StateData) => {
    setIsLoading(true);
    setTimeout(() => {
      setActiveState(state);
      setLevel(2);
      setSearchTerm('');
      setIsLoading(false);
    }, 120);
  };

  const handleCityClick = (city: CityData) => {
    setIsLoading(true);
    setTimeout(() => {
      setActiveCity(city);
      setLevel(3);
      setSearchTerm('');
      setIsLoading(false);
    }, 120);
  };

  const handleShowroomClick = (showroom: ShowroomData) => {
    if (activeState && activeCity) {
      onSelectShowroom(activeState, activeCity, showroom);
      onClose();
    }
  };

  const handleChooseEntireCity = () => {
    if (activeState && activeCity) {
      onSelectCityOnly(activeState, activeCity);
      onClose();
    }
  };

  const handleBack = () => {
    setSearchTerm('');
    if (level === 3) {
      setLevel(2);
    } else if (level === 2) {
      setLevel(1);
      setActiveCity(null);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(4, 42, 43, 0.45)',
      backdropFilter: 'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: '4.5rem 1rem 2rem'
    }}>
      <div 
        ref={modalRef}
        className="card"
        style={{
          width: '100%',
          maxWidth: '720px',
          maxHeight: 'calc(88vh - 4.5rem)',
          display: 'flex',
          flexDirection: 'column',
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 20px 40px -10px rgba(4, 42, 43, 0.25)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden',
          animation: 'fade-in 0.25s ease-out'
        }}
      >
        {/* MODAL HEADER WITH BREADCRUMB & CLOSE */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-color)',
          background: 'linear-gradient(to right, #F8FAFC, #FFFFFF)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {level > 1 && (
              <button 
                onClick={handleBack}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.35rem 0.65rem',
                  borderRadius: '8px',
                  background: 'var(--color-success-light)',
                  border: '1px solid rgba(14, 131, 96, 0.2)',
                  color: 'var(--color-success-hover)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <ArrowLeft size={14} />
                Back
              </button>
            )}

            {/* Breadcrumb Navigation */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem' }}>
              <button
                onClick={() => { setLevel(1); setSearchTerm(''); }}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  color: level === 1 ? 'var(--color-primary)' : 'var(--text-secondary)',
                  fontWeight: level === 1 ? 800 : 500,
                  cursor: 'pointer'
                }}
              >
                Sales Territory
              </button>

              {activeState && (
                <>
                  <ChevronRight size={14} style={{ color: 'var(--text-secondary)' }} />
                  <button
                    onClick={() => { setLevel(2); setSearchTerm(''); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      color: level === 2 ? 'var(--color-primary)' : 'var(--text-secondary)',
                      fontWeight: level === 2 ? 800 : 500,
                      cursor: 'pointer'
                    }}
                  >
                    {activeState.name}
                  </button>
                </>
              )}

              {activeCity && level === 3 && (
                <>
                  <ChevronRight size={14} style={{ color: 'var(--text-secondary)' }} />
                  <span style={{ fontWeight: 800, color: 'var(--color-primary)' }}>
                    {activeCity.name}
                  </span>
                </>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {(initialSelectedCity || initialSelectedState) && (
              <button
                onClick={() => {
                  onClearSelection();
                  setLevel(1);
                  setActiveState(null);
                  setActiveCity(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '0.78rem',
                  color: 'var(--color-danger)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px'
                }}
              >
                Clear Filter
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '0.4rem',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* SEARCH BAR & SUMMARY STRIP */}
        <div style={{
          padding: '1rem 1.5rem',
          borderBottom: '1px solid var(--border-color)',
          background: '#FAFCFB',
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: '#ffffff',
            border: '1px solid var(--border-color)',
            borderRadius: '24px',
            padding: '0.4rem 0.85rem',
            flexGrow: 1,
            maxWidth: '380px'
          }}>
            <Search size={15} style={{ color: 'var(--text-secondary)' }} />
            <input 
              type="text"
              placeholder={
                level === 1 ? 'Search states by name or code...' :
                level === 2 ? `Search cities in ${activeState?.name}...` :
                `Search showrooms in ${activeCity?.name}...`
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                fontSize: '0.84rem',
                width: '100%',
                fontFamily: 'inherit'
              }}
              autoFocus
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0 }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {level === 1 && (
              <span>Showing <strong>{filteredStates.length}</strong> States with Active EV Sales</span>
            )}
            {level === 2 && activeState && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span><strong>{filteredCities.length}</strong> Cities in {activeState.name}</span>
                <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>• {activeState.totalVehiclesSold} Total Sold</span>
              </div>
            )}
            {level === 3 && activeCity && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span><strong>{filteredShowrooms.length}</strong> Authorized Showrooms</span>
                <button
                  onClick={handleChooseEntireCity}
                  style={{
                    background: 'var(--color-primary)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '20px',
                    padding: '0.25rem 0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
                  <MapPin size={12} />
                  Filter for {activeCity.name}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* SCROLLABLE DRILLDOWN CONTENT */}
        <div style={{
          padding: '1.25rem 1.5rem',
          overflowY: 'auto',
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          {isLoading ? (
            <div style={{ padding: '3rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', color: 'var(--color-primary)' }}>
              <div className="spinner"></div>
              <span style={{ fontSize: '0.85rem' }}>Loading regional fleet directory...</span>
            </div>
          ) : (
            <>
              {/* LEVEL 1: STATES LIST / GRID */}
              {level === 1 && (
                filteredStates.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.85rem' }}>
                    {filteredStates.map((state) => {
                      const isCurrentState = initialSelectedState?.id === state.id;
                      return (
                        <div
                          key={state.id}
                          onClick={() => handleStateClick(state)}
                          style={{
                            padding: '1rem 1.15rem',
                            borderRadius: '12px',
                            background: isCurrentState ? 'var(--color-success-light)' : '#ffffff',
                            border: `1.5px solid ${isCurrentState ? 'var(--color-primary)' : 'var(--border-color)'}`,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.6rem',
                            position: 'relative'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--color-primary)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 6px 12px rgba(14, 131, 96, 0.08)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = isCurrentState ? 'var(--color-primary)' : 'var(--border-color)';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <span style={{
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                background: 'rgba(14, 131, 96, 0.1)',
                                color: 'var(--color-primary)',
                                padding: '0.15rem 0.45rem',
                                borderRadius: '4px',
                                letterSpacing: '0.04em'
                              }}>
                                {state.code}
                              </span>
                              <h4 style={{ margin: '0.35rem 0 0 0', fontSize: '1rem', fontWeight: 700, color: '#042A2B' }}>
                                {state.name}
                              </h4>
                            </div>
                            <ChevronRight size={18} style={{ color: 'var(--text-secondary)' }} />
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-secondary)', borderTop: '1px dashed var(--border-color)', paddingTop: '0.5rem', marginTop: '0.2rem' }}>
                            <span>{state.totalCities} Cities</span>
                            <span style={{ fontWeight: 700, color: 'var(--color-success-hover)' }}>{state.totalVehiclesSold} Sold</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <p style={{ margin: 0, fontWeight: 600 }}>No states matching "{searchTerm}"</p>
                    <span style={{ fontSize: '0.8rem' }}>Check spelling or clear the filter</span>
                  </div>
                )
              )}

              {/* LEVEL 2: CITIES LIST */}
              {level === 2 && activeState && (
                filteredCities.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {filteredCities.map((city) => {
                      const isCurrentCity = initialSelectedCity?.id === city.id;
                      return (
                        <div
                          key={city.id}
                          onClick={() => handleCityClick(city)}
                          style={{
                            padding: '1rem 1.25rem',
                            borderRadius: '12px',
                            background: isCurrentCity ? 'var(--color-success-light)' : '#ffffff',
                            border: `1.5px solid ${isCurrentCity ? 'var(--color-primary)' : 'var(--border-color)'}`,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '1rem'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--color-primary)';
                            e.currentTarget.style.background = '#F8FAFC';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = isCurrentCity ? 'var(--color-primary)' : 'var(--border-color)';
                            e.currentTarget.style.background = isCurrentCity ? 'var(--color-success-light)' : '#ffffff';
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                            <div style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '10px',
                              background: 'rgba(14, 131, 96, 0.1)',
                              color: 'var(--color-primary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <MapPin size={18} />
                            </div>
                            <div>
                              <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: '#042A2B' }}>
                                {city.name}
                              </h4>
                              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                {city.showrooms.length} Showrooms • Avg Battery Health: <strong style={{ color: city.averageSoh >= 88 ? 'var(--color-success-hover)' : 'var(--color-warning)' }}>{city.averageSoh}%</strong>
                              </span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#042A2B' }}>{city.totalVehiclesSold}</div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Vehicles Sold</div>
                            </div>
                            <ChevronRight size={18} style={{ color: 'var(--text-secondary)' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <p style={{ margin: 0, fontWeight: 600 }}>No cities found matching "{searchTerm}"</p>
                  </div>
                )
              )}

              {/* LEVEL 3: SHOWROOMS CARDS */}
              {level === 3 && activeCity && (
                filteredShowrooms.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {filteredShowrooms.map((showroom) => {
                      const isCurrentShowroom = initialSelectedShowroom?.id === showroom.id;
                      return (
                        <div
                          key={showroom.id}
                          onClick={() => handleShowroomClick(showroom)}
                          style={{
                            padding: '1.15rem 1.35rem',
                            borderRadius: '12px',
                            background: isCurrentShowroom ? 'var(--color-success-light)' : '#ffffff',
                            border: `1.5px solid ${isCurrentShowroom ? 'var(--color-primary)' : 'var(--border-color)'}`,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.75rem'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--color-primary)';
                            e.currentTarget.style.boxShadow = '0 6px 16px rgba(14, 131, 96, 0.08)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = isCurrentShowroom ? 'var(--color-primary)' : 'var(--border-color)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                              <div style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '10px',
                                background: '#042A2B',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                              }}>
                                <Store size={18} />
                              </div>
                              <div>
                                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#042A2B' }}>
                                  {showroom.name}
                                </h4>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginTop: '0.15rem' }}>
                                  {showroom.address}
                                </span>
                              </div>
                            </div>

                            <div style={{
                              padding: '0.25rem 0.65rem',
                              borderRadius: '20px',
                              background: showroom.averageSoh >= 88 ? 'var(--color-success-light)' : 'var(--color-warning-light)',
                              color: showroom.averageSoh >= 88 ? 'var(--color-success-hover)' : 'var(--color-warning)',
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              whiteSpace: 'nowrap',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.3rem'
                            }}>
                              <Activity size={13} />
                              Avg SoH: {showroom.averageSoh}%
                            </div>
                          </div>

                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                            gap: '0.75rem',
                            fontSize: '0.8rem',
                            color: 'var(--text-secondary)',
                            background: '#F8FAFC',
                            padding: '0.65rem 0.85rem',
                            borderRadius: '8px'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <User size={13} style={{ color: 'var(--color-primary)' }} />
                              <span>Manager: <strong>{showroom.manager}</strong></span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <Phone size={13} style={{ color: 'var(--color-primary)' }} />
                              <span>{showroom.contact}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <Car size={13} style={{ color: 'var(--color-primary)' }} />
                              <span>Sold: <strong style={{ color: '#042A2B' }}>{showroom.totalVehiclesSold} vehicles</strong></span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.35rem', color: 'var(--color-primary)', fontSize: '0.8rem', fontWeight: 700 }}>
                            <span>View All Sold Vehicles & Battery Logs</span>
                            <ChevronRight size={15} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <p style={{ margin: 0, fontWeight: 600 }}>No showrooms found in {activeCity.name}</p>
                  </div>
                )
              )}
            </>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div style={{
          padding: '0.85rem 1.5rem',
          borderTop: '1px solid var(--border-color)',
          background: '#F8FAFC',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.78rem',
          color: 'var(--text-secondary)'
        }}>
          <span>Drill-down: State → City → Showroom → Fleet Telemetry</span>
          <button
            onClick={onClose}
            style={{
              background: '#ffffff',
              border: '1px solid var(--border-color)',
              padding: '0.35rem 0.85rem',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
