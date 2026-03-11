import { useState, useEffect } from 'react';
import { studentAPI, jobAPI } from '../../services/api';
import theme from './theme';
import {
    PageHeader, StatCard, Card, LoadingSpinner,
} from './StudentComponents';
import {
    TrendingUp, Award, Target, BarChart3, CheckCircle,
    Flame, Star, Calendar, BookOpen, Briefcase, AlertCircle
} from 'lucide-react';

export const StudentProgress = () => {
    const [progress, setProgress] = useState(null);
    const [eligibility, setEligibility] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try { 
                const [progRes, eligRes] = await Promise.all([
                    studentAPI.getProgress(),
                    jobAPI.getEligibility()
                ]);
                setProgress(progRes.data || {}); 
                setEligibility(eligRes.data || null);
            } catch (error) {
                console.error("Error fetching progress data", error);
            } finally { 
                setLoading(false); 
            }
        };
        fetchData();
    }, []);

    if (loading) return <LoadingSpinner label="Loading progress..." />;

    const p = progress || {};
    const attendance = p.attendance || 0;
    const streak = p.streak || 0;
    const rank = p.rank || '—';
    const loyaltyPoints = p.loyalty_points || p.loyaltyPoints || 0;
    const testAvg = p.test_avg || p.testAverage || null;
    const moduleData = p.modules || [];
    const totalModules = moduleData.length;
    const completedModules = moduleData.filter(m => m.completed || m.progress === 100).length;

    // Attendance ring
    const radius = 56;
    const circumference = 2 * Math.PI * radius;
    const strokeDash = (attendance / 100) * circumference;
    const attendanceColor = attendance >= 85 ? theme.accent.green : attendance >= 60 ? theme.accent.yellow : theme.accent.red;

    return (
        <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <PageHeader
                title="My Progress"
                subtitle="Track your learning journey and performance"
                icon={<TrendingUp size={24} />}
                accentColor={theme.accent.green}
            />

            {/* Top Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '24px' }}>
                <StatCard icon={<Calendar size={22} />} label="Attendance" value={`${attendance}%`} accentColor={theme.accent.cyan} />
                <StatCard icon={<Flame size={22} />} label="Streak" value={`${streak} days`} accentColor={theme.accent.red} />
                <StatCard icon={<Award size={22} />} label="Class Rank" value={`#${rank}`} accentColor={theme.accent.yellow} />
                <StatCard icon={<Star size={22} />} label="Loyalty Points" value={loyaltyPoints} accentColor={theme.accent.purple} />
            </div>

            {/* Main Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                {/* Attendance Ring */}
                <Card style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: '32px 24px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.text.label, marginBottom: '24px' }}>
                        Attendance Overview
                    </div>
                    <div style={{ position: 'relative', width: '140px', height: '140px', marginBottom: '20px' }}>
                        <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)' }}>
                            <circle cx="70" cy="70" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
                            <circle cx="70" cy="70" r={radius} fill="none" stroke={attendanceColor} strokeWidth="10"
                                strokeDasharray={circumference} strokeDashoffset={circumference - strokeDash}
                                strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                            />
                        </svg>
                        <div style={{
                            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                        }}>
                            <span style={{ fontSize: '32px', fontWeight: 800, color: attendanceColor }}>{attendance}%</span>
                            <span style={{ fontSize: '10px', fontWeight: 600, color: theme.text.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Present</span>
                        </div>
                    </div>
                    <div style={{
                        padding: '8px 18px', borderRadius: theme.radius.full,
                        background: `${attendanceColor}12`, border: `1px solid ${attendanceColor}25`,
                        fontSize: '11px', fontWeight: 700, color: attendanceColor,
                    }}>
                        {attendance >= 85 ? '✅ Placement Eligible' : attendance >= 60 ? '⚠️ Needs Improvement' : '🚨 At Risk'}
                    </div>
                </Card>

                {/* Test Performance */}
                <Card>
                    <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.text.label, marginBottom: '20px' }}>
                        Performance Metrics
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {/* Test Average */}
                        <div style={{
                            background: theme.bg.input, border: `1px solid ${theme.border.subtle}`,
                            borderRadius: theme.radius.md, padding: '18px',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <BarChart3 size={16} color={theme.accent.blue} />
                                    <span style={{ fontSize: '12px', fontWeight: 700, color: theme.text.secondary }}>Test Average</span>
                                </div>
                                <span style={{
                                    fontSize: '22px', fontWeight: 800,
                                    color: testAvg && testAvg >= 80 ? theme.accent.green : testAvg && testAvg >= 50 ? theme.accent.yellow : theme.accent.red,
                                }}>
                                    {testAvg ? `${testAvg}%` : '—'}
                                </span>
                            </div>
                            <div style={{ height: '5px', borderRadius: '3px', background: 'rgba(255,255,255,0.06)' }}>
                                <div style={{
                                    height: '100%', borderRadius: '3px', transition: 'width 0.6s',
                                    width: `${testAvg || 0}%`,
                                    background: testAvg >= 80 ? theme.accent.green : testAvg >= 50 ? theme.accent.yellow : theme.accent.red,
                                }} />
                            </div>
                        </div>

                        {/* Modules Completed */}
                        <div style={{
                            background: theme.bg.input, border: `1px solid ${theme.border.subtle}`,
                            borderRadius: theme.radius.md, padding: '18px',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <BookOpen size={16} color={theme.accent.green} />
                                    <span style={{ fontSize: '12px', fontWeight: 700, color: theme.text.secondary }}>Modules Progress</span>
                                </div>
                                <span style={{ fontSize: '22px', fontWeight: 800, color: theme.text.primary }}>{completedModules}/{totalModules}</span>
                            </div>
                            <div style={{ height: '5px', borderRadius: '3px', background: 'rgba(255,255,255,0.06)' }}>
                                <div style={{
                                    height: '100%', borderRadius: '3px', transition: 'width 0.6s',
                                    width: totalModules ? `${(completedModules / totalModules) * 100}%` : '0%',
                                    background: theme.accent.green,
                                }} />
                            </div>
                        </div>

                        {/* Loyalty Tier */}
                        <div style={{
                            background: `${theme.accent.yellow}08`, border: `1px solid ${theme.accent.yellow}20`,
                            borderRadius: theme.radius.md, padding: '18px',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Star size={20} color={theme.accent.yellow} />
                                <div>
                                    <div style={{ fontSize: '12px', fontWeight: 700, color: theme.text.primary }}>Loyalty Tier</div>
                                    <div style={{ fontSize: '10px', color: theme.text.muted, marginTop: '2px' }}>{loyaltyPoints} points earned</div>
                                </div>
                            </div>
                            <span style={{ fontSize: '22px', fontWeight: 800, color: theme.accent.yellow }}>
                                {loyaltyPoints >= 500 ? '💎' : loyaltyPoints >= 200 ? '🥇' : loyaltyPoints >= 100 ? '🥈' : '🥉'}
                            </span>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Placement Eligibility Tracking */}
            {eligibility && eligibility.criteria && (
                <Card style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Briefcase size={20} color={theme.accent.purple} />
                            <div style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.text.label }}>
                                Placement Eligibility Criteria
                            </div>
                        </div>
                        {eligibility.canRequest ? (
                            <span style={{ padding: '6px 12px', background: `${theme.accent.green}20`, color: theme.accent.green, borderRadius: theme.radius.full, fontSize: '12px', fontWeight: 700 }}>
                                Eligible to Apply
                            </span>
                        ) : (
                            <span style={{ padding: '6px 12px', background: `${theme.accent.red}20`, color: theme.accent.red, borderRadius: theme.radius.full, fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <AlertCircle size={14} /> Action Required
                            </span>
                        )}
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                        {Object.entries(eligibility.criteria).filter(([key]) => key !== 'portfolio' || eligibility.criteria.portfolio.met !== undefined).map(([key, data]) => {
                            const isMet = data.met;
                            const title = key.charAt(0).toUpperCase() + key.slice(1);
                            
                            let valueDisplay = '';
                            let progressPct = 0;
                            
                            if (key === 'portfolio') {
                                valueDisplay = isMet ? 'Approved' : 'Pending';
                                progressPct = isMet ? 100 : 0;
                            } else {
                                valueDisplay = `${data.value} / ${data.target}${key !== 'capstone' ? '%' : ''}`;
                                progressPct = Math.min(100, Math.max(0, (data.value / data.target) * 100));
                            }

                            return (
                                <div key={key} style={{
                                    padding: '16px', borderRadius: theme.radius.md,
                                    background: isMet ? `${theme.accent.green}05` : `${theme.accent.red}05`,
                                    border: `1px solid ${isMet ? theme.accent.green + '20' : theme.accent.red + '20'}`
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                        <span style={{ fontSize: '13px', fontWeight: 600, color: theme.text.secondary }}>{title} Status</span>
                                        <span style={{ fontSize: '13px', fontWeight: 800, color: isMet ? theme.accent.green : theme.text.primary }}>
                                            {valueDisplay}
                                        </span>
                                    </div>
                                    <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.06)' }}>
                                        <div style={{
                                            height: '100%', borderRadius: '3px', transition: 'width 0.6s',
                                            width: `${progressPct}%`,
                                            background: isMet ? theme.accent.green : theme.accent.yellow,
                                        }} />
                                    </div>
                                    <div style={{ fontSize: '11px', marginTop: '10px', color: theme.text.muted }}>
                                        {isMet ? `Requirement met.` : `Goal: ${data.target}${key !== 'capstone' ? '%' : ''} required`}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            )}

            {/* Module Roadmap */}
            {moduleData.length > 0 && (
                <Card>
                    <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.text.label, marginBottom: '20px' }}>
                        Module Roadmap
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {moduleData.map((mod, idx) => {
                            const prog = mod.progress || (mod.completed ? 100 : 0);
                            const isComplete = prog === 100 || mod.completed;
                            const modColor = isComplete ? theme.accent.green : prog > 0 ? theme.accent.blue : theme.text.muted;
                            return (
                                <div key={mod.id || idx} style={{
                                    display: 'flex', alignItems: 'center', gap: '14px',
                                    padding: '14px 16px', borderRadius: theme.radius.md,
                                    background: isComplete ? `${theme.accent.green}06` : 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${isComplete ? theme.accent.green + '20' : theme.border.subtle}`,
                                }}>
                                    <div style={{
                                        width: '34px', height: '34px', borderRadius: theme.radius.sm,
                                        background: `${modColor}15`, display: 'flex',
                                        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                        fontSize: '12px', fontWeight: 800, color: modColor,
                                    }}>
                                        {isComplete ? <CheckCircle size={16} /> : idx + 1}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            fontSize: '13px', fontWeight: 700, color: theme.text.primary,
                                            marginBottom: '6px',
                                        }}>
                                            {mod.name || mod.module_name}
                                        </div>
                                        <div style={{ height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.06)' }}>
                                            <div style={{
                                                height: '100%', borderRadius: '2px',
                                                width: `${prog}%`, background: modColor,
                                                transition: 'width 0.4s',
                                            }} />
                                        </div>
                                    </div>
                                    <span style={{ fontSize: '12px', fontWeight: 700, color: modColor }}>{prog}%</span>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            )}
            <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
        </div>
    );
};

export default StudentProgress;
