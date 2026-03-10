import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { ClipboardList, Filter, Search, Clock, User, Shield, Activity, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

export const AdminAuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [limit, setLimit] = useState(50);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await adminAPI.getAuditLogs(limit);
            setLogs(res.data.logs);
        } catch (error) {
            console.error("Failed to fetch audit logs:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [limit]);

    const filteredLogs = logs.filter(log =>
        log.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getActionColor = (action) => {
        const a = action.toLowerCase();
        if (a.includes('create') || a.includes('add')) return '#20c997';
        if (a.includes('delete') || a.includes('remove')) return '#ff6b6b';
        if (a.includes('update') || a.includes('edit')) return '#4dabf7';
        return 'var(--text-muted)';
    };

    return (
        <div className="portal-page" style={{ animation: 'fadeIn 0.5s ease' }}>
            <div className="page-header">
                <div>
                    <h1 className="flex items-center gap-2">
                        <Shield size={24} className="text-primary" /> System Transparency Log
                    </h1>
                    <p>Live audit trail of administrative actions and security modifications.</p>
                </div>
                <div className="header-actions">
                    <button className="btn btn-secondary flex gap-2" onClick={fetchLogs} disabled={loading}>
                        <RefreshCw size={16} className={loading ? 'spin' : ''} /> Sync Records
                    </button>
                </div>
            </div>

            {/* Controls */}
            <div className="card mb-4 p-4 flex justify-between items-center gap-4 flex-wrap">
                <div className="flex-1" style={{ minWidth: '250px' }}>
                    <div className="search-box">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search by admin, action, or specific details..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-secondary">Display Limit:</span>
                    <select
                        value={limit}
                        onChange={(e) => setLimit(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }}
                    >
                        <option value={20}>Last 20</option>
                        <option value={50}>Last 50</option>
                        <option value={100}>Last 100</option>
                        <option value={500}>Last 500</option>
                    </select>
                </div>
            </div>

            {/* Log Table */}
            <div className="card no-padding overflow-hidden">
                <table className="portal-table">
                    <thead>
                        <tr>
                            <th>Timestamp</th>
                            <th>Administrator</th>
                            <th>Action</th>
                            <th>Affected Module</th>
                            <th>Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="5" className="text-center p-5">
                                    <div className="spinner mb-2"></div>
                                    <p className="text-secondary text-sm">Parsing blockchain logs...</p>
                                </td>
                            </tr>
                        ) : filteredLogs.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="text-center p-5">
                                    <Activity size={40} className="text-secondary mb-3 opacity-20" />
                                    <h4 className="m-0 text-secondary">No matching logs found</h4>
                                </td>
                            </tr>
                        ) : filteredLogs.map((log, idx) => (
                            <tr key={log.id || idx}>
                                <td style={{ minWidth: '150px' }}>
                                    <div className="flex items-center gap-2">
                                        <Clock size={14} className="text-secondary" />
                                        <span className="text-xs font-medium">
                                            {format(new Date(log.created_at), 'MMM dd, HH:mm:ss')}
                                        </span>
                                    </div>
                                </td>
                                <td>
                                    <div className="flex items-center gap-2">
                                        <div className="user-avatar-xs" style={{ background: 'var(--primary-subtle)', color: 'var(--primary)' }}>
                                            {log.first_name?.[0]}{log.last_name?.[0]}
                                        </div>
                                        <div>
                                            <p className="m-0 font-bold text-sm">{log.first_name} {log.last_name}</p>
                                            <p className="m-0 text-xs text-secondary">{log.role_name || 'System'}</p>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span className="badge" style={{
                                        background: `${getActionColor(log.action)}15`,
                                        color: getActionColor(log.action),
                                        border: `1px solid ${getActionColor(log.action)}30`,
                                        fontSize: '0.7rem',
                                        fontWeight: 800
                                    }}>
                                        {log.action?.toUpperCase()}
                                    </span>
                                </td>
                                <td className="font-bold text-sm text-primary">
                                    {log.module_name?.toUpperCase() || 'CORE'}
                                </td>
                                <td style={{ maxWidth: '400px' }}>
                                    <p className="text-xs m-0 text-dark leading-relaxed">
                                        {log.details}
                                    </p>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <style>{`
                .user-avatar-xs { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.75rem; }
                .portal-table th { background: var(--bg-surface); color: var(--text-muted); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px; padding: 1rem; }
                .portal-table td { padding: 1rem; border-bottom: 1px solid var(--border-color); vertical-align: middle; }
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};

export default AdminAuditLogs;
