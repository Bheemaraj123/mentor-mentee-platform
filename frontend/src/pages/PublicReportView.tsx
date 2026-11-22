import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import { CalendarDays, TrendingUp, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

interface PublicReport {
  id: number;
  meeting_title: string;
  meeting_date: string | null;
  summary: string | null;
  themes: string[];
  action_items: Array<{
    task: string;
    description?: string | null;
    deadline?: string | null;
    responsible?: string | null;
  }>;
  progress: string | null;
  strengths: string[];
  weaknesses: string[];
  follow_up_recommendations: string | null;
}

function ErrorState({ message }: { message: string }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      padding: '40px 20px',
      textAlign: 'center',
      background: '#fbfdff',
    }}>
      <div style={{
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        background: '#fff0eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '24px',
        boxShadow: '0 0 0 10px #fff5f0',
      }}>
        <XCircle size={36} style={{ color: '#d87963' }} />
      </div>
      <h1 style={{
        margin: '0 0 12px',
        fontSize: '28px',
        fontWeight: 700,
        color: '#1a2b4a',
      }}>
        Report unavailable
      </h1>
      <p style={{
        margin: 0,
        fontSize: '15px',
        lineHeight: 1.6,
        color: '#64758d',
        maxWidth: '420px',
      }}>
        {message}
      </p>
      <p style={{
        marginTop: '16px',
        fontSize: '13px',
        color: '#94a3b8',
      }}>
        This link may have expired, been revoked, or the report was deleted.
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      padding: '40px 20px',
      textAlign: 'center',
      background: '#fbfdff',
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        border: '4px solid #e2e8f0',
        borderTopColor: '#4678f7',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '20px',
      }} />
      <p style={{ margin: 0, fontSize: '15px', color: '#64758d' }}>
        Loading report...
      </p>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export function PublicReportView() {
  const { token } = useParams<{ token: string }>();
  const [report, setReport] = useState<PublicReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    api
      .get(`/reports/public/${token}`)
      .then((response) => {
        if (!cancelled) {
          setReport(response.data);
          setLoading(false);
        }
      })
      .catch((err: any) => {
        if (!cancelled) {
          const detail = err?.response?.data?.detail;
          if (
  err?.response?.status === 404 ||
  (typeof detail === 'string' && detail.toLowerCase().includes('not found'))
) {
            setError('This shared report link is invalid, has been revoked, or the report no longer exists.');
          } else {
            setError('Unable to load the shared report. Please try again later.');
          }
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading) return <LoadingState />;
  if (error || !report) return <ErrorState message={error || 'This shared report link is invalid or has expired.'} />;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Date not specified';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f6f9fc',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    }}>
      <header style={{
        padding: '24px 20px',
        background: '#fff',
        borderBottom: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(15, 32, 60, 0.05)',
      }}>
        <div style={{
          maxWidth: '880px',
          margin: '0 auto',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '8px',
          }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '4px 10px',
              background: '#e8f0ff',
              color: '#4678f7',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.3px',
              textTransform: 'uppercase',
            }}>
              Shared Report
            </span>
            <span style={{
              color: '#94a3b8',
              fontSize: '13px',
            }}>
              Public link
            </span>
          </div>
          <h1 style={{
            margin: 0,
            fontSize: '30px',
            fontWeight: 700,
            color: '#1a2b4a',
            letterSpacing: '-0.5px',
            lineHeight: 1.2,
          }}>
            {report.meeting_title}
          </h1>
        </div>
      </header>

      <main style={{
        maxWidth: '880px',
        margin: '0 auto',
        padding: '32px 20px 60px',
      }}>
        {report.meeting_date && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 14px',
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            marginBottom: '28px',
            fontSize: '14px',
            color: '#475569',
          }}>
            <CalendarDays size={16} style={{ color: '#4678f7' }} />
            <span>{formatDate(report.meeting_date)}</span>
          </div>
        )}

        {report.progress && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '20px 24px',
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            marginBottom: '28px',
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #4678f7, #5d86ff)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '16px',
              fontWeight: 700,
              flexShrink: 0,
            }}>
              {report.progress}
            </div>
            <div>
              <div style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#4678f7',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '4px',
              }}>
                Overall Progress
              </div>
              <div style={{
                fontSize: '15px',
                color: '#334155',
                fontWeight: 500,
              }}>
                {report.summary?.split('.')[0] || 'Progress summary'}
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gap: '24px' }}>
          {report.summary && (
            <section style={{
              padding: '24px',
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
            }}>
              <h2 style={{
                margin: '0 0 16px',
                fontSize: '18px',
                fontWeight: 700,
                color: '#1a2b4a',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}>
                <span style={{
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#e8f0ff',
                  color: '#4678f7',
                  borderRadius: '7px',
                  fontSize: '10px',
                  fontWeight: 800,
                }}>
                  01
                </span>
                Meeting Summary
              </h2>
              <p style={{
                margin: 0,
                fontSize: '15px',
                lineHeight: 1.7,
                color: '#334155',
                whiteSpace: 'pre-wrap',
              }}>
                {report.summary}
              </p>
            </section>
          )}

          {report.themes.length > 0 && (
            <section style={{
              padding: '24px',
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
            }}>
              <h2 style={{
                margin: '0 0 16px',
                fontSize: '18px',
                fontWeight: 700,
                color: '#1a2b4a',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}>
                <span style={{
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#e8f0ff',
                  color: '#4678f7',
                  borderRadius: '7px',
                  fontSize: '10px',
                  fontWeight: 800,
                }}>
                  02
                </span>
                Key Themes
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '12px',
              }}>
                {report.themes.map((theme, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '16px',
                      background: '#fbfdff',
                      border: '1px solid #e2ebf7',
                      borderRadius: '9px',
                      fontSize: '13px',
                      lineHeight: 1.5,
                      color: '#475569',
                    }}
                  >
                    {theme}
                  </div>
                ))}
              </div>
            </section>
          )}

          {report.action_items.length > 0 && (
            <section style={{
              padding: '24px',
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
            }}>
              <h2 style={{
                margin: '0 0 16px',
                fontSize: '18px',
                fontWeight: 700,
                color: '#1a2b4a',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}>
                <span style={{
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#e8f0ff',
                  color: '#4678f7',
                  borderRadius: '7px',
                  fontSize: '10px',
                  fontWeight: 800,
                }}>
                  03
                </span>
                Action Items
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {report.action_items.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '16px',
                      background: '#fbfdff',
                      border: '1px solid #e2ebf7',
                      borderRadius: '9px',
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                    }}>
                      <CheckCircle2 size={18} style={{ color: '#22c55e', flexShrink: 0, marginTop: '2px' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: 600,
                          color: '#1a2b4a',
                          marginBottom: '4px',
                        }}>
                          {item.task}
                        </div>
                        {item.description && (
                          <div style={{
                            fontSize: '13px',
                            color: '#64758d',
                            marginBottom: '8px',
                          }}>
                            {item.description}
                          </div>
                        )}
                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '12px',
                          fontSize: '12px',
                          color: '#94a3b8',
                        }}>
                          {item.deadline && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <CalendarDays size={13} /> Due: {new Date(item.deadline).toLocaleDateString()}
                            </span>
                          )}
                          {item.responsible && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <TrendingUp size={13} /> {item.responsible}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {(report.strengths.length > 0 || report.weaknesses.length > 0) && (
            <section style={{
              padding: '24px',
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
            }}>
              <h2 style={{
                margin: '0 0 16px',
                fontSize: '18px',
                fontWeight: 700,
                color: '#1a2b4a',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}>
                <span style={{
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#e8f0ff',
                  color: '#4678f7',
                  borderRadius: '7px',
                  fontSize: '10px',
                  fontWeight: 800,
                }}>
                  04
                </span>
                Strengths & Development Areas
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '24px',
              }}>
                {report.strengths.length > 0 && (
                  <div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#16a34a',
                      marginBottom: '10px',
                    }}>
                      <CheckCircle2 size={15} /> Strengths
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {report.strengths.map((s, i) => (
                        <li key={i} style={{ fontSize: '13px', color: '#334155', lineHeight: 1.5 }}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {report.weaknesses.length > 0 && (
                  <div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#dc2626',
                      marginBottom: '10px',
                    }}>
                      <AlertTriangle size={15} /> Development Areas
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {report.weaknesses.map((w, i) => (
                        <li key={i} style={{ fontSize: '13px', color: '#334155', lineHeight: 1.5 }}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>
          )}

          {report.follow_up_recommendations && (
            <section style={{
              padding: '24px',
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
            }}>
              <h2 style={{
                margin: '0 0 16px',
                fontSize: '18px',
                fontWeight: 700,
                color: '#1a2b4a',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}>
                <span style={{
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#e8f0ff',
                  color: '#4678f7',
                  borderRadius: '7px',
                  fontSize: '10px',
                  fontWeight: 800,
                }}>
                  05
                </span>
                Follow-Up Recommendations
              </h2>
              <p style={{
                margin: 0,
                fontSize: '15px',
                lineHeight: 1.7,
                color: '#334155',
                whiteSpace: 'pre-wrap',
              }}>
                {report.follow_up_recommendations}
              </p>
            </section>
          )}
        </div>

        <footer style={{
          marginTop: '40px',
          paddingTop: '24px',
          borderTop: '1px solid #e2e8f0',
          textAlign: 'center',
          color: '#94a3b8',
          fontSize: '12px',
        }}>
          <p>This report was shared via a secure link.</p>
          <p style={{ marginTop: '4px' }}>Safe-Men.AI — Mentorship Intelligence</p>
        </footer>
      </main>
    </div>
  );
}