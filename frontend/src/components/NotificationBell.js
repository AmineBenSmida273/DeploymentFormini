import React, { useState, useEffect, useRef } from 'react';
import { notificationService } from '../services/api';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

export default function NotificationBell() {
    const { theme, isDarkMode } = useTheme();
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);

    // Charger le nombre de non-lus au chargement et périodiquement
    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000); // Poll toutes les 30s
        return () => clearInterval(interval);
    }, []);

    // Fermer le dropdown si clic à l'extérieur
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);

    const fetchUnreadCount = async () => {
        try {
            const res = await notificationService.getUnreadCount();
            setUnreadCount(res.data.count);
        } catch (error) {
            console.error('Erreur count notifications:', error);
        }
    };

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const res = await notificationService.getMyNotifications();
            setNotifications(res.data);
        } catch (error) {
            console.error('Erreur fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBellClick = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            fetchNotifications();
        }
    };

    const handleMarkAsRead = async (id, e) => {
        e.stopPropagation();
        try {
            await notificationService.markAsRead(id);
            // Mettre à jour l'état local
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, lu: true } : n));
            // Mettre un jour le compteur global
            if (unreadCount > 0) setUnreadCount(prev => prev - 1);
        } catch (error) {
            console.error('Erreur mark as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, lu: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Erreur mark all read:', error);
        }
    };

    const getIconApi = (type) => {
        switch (type) {
            case 'success': return '✅';
            case 'error': return '❌';
            case 'warning': return '⚠️';
            default: return 'ℹ️';
        }
    };

    const containerStyle = {
        position: 'absolute',
        top: '40px',
        right: '0',
        width: '320px',
        background: theme.paper,
        borderRadius: '12px',
        boxShadow: theme.shadow,
        border: `1px solid ${theme.border}`,
        zIndex: 1000,
        maxHeight: '400px',
        display: 'flex',
        flexDirection: 'column',
        color: theme.text
    };

    const headerStyle = {
        padding: '15px',
        borderBottom: `1px solid ${theme.border}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: isDarkMode ? '#1e293b' : '#f9fafb',
        borderTopLeftRadius: '12px',
        borderTopRightRadius: '12px',
    };

    return (
        <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
                onClick={handleBellClick}
                style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    position: 'relative',
                    padding: '8px',
                    fontSize: '20px',
                    filter: isDarkMode ? 'brightness(0) invert(1)' : 'none'
                }}
            >
                🔔
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '0px',
                        right: '0px',
                        background: '#ef4444',
                        color: 'white',
                        borderRadius: '50%',
                        width: '18px',
                        height: '18px',
                        fontSize: '11px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        filter: 'none' // Prevent filter inheritance
                    }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div style={containerStyle}>
                    <div style={headerStyle}>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: theme.text }}>Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                style={{
                                    border: 'none',
                                    background: 'none',
                                    color: '#3b82f6',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    fontWeight: '500'
                                }}
                            >
                                Tout marquer comme lu
                            </button>
                        )}
                    </div>

                    <div style={{ overflowY: 'auto', flex: 1 }}>
                        {loading ? (
                            <div style={{ padding: '20px', textAlign: 'center', color: theme.textSecondary }}>Chargement...</div>
                        ) : notifications.length === 0 ? (
                            <div style={{ padding: '20px', textAlign: 'center', color: theme.textSecondary }}>
                                Aucune notification
                            </div>
                        ) : (
                            notifications.map(notif => (
                                <div
                                    key={notif._id}
                                    style={{
                                        padding: '12px 15px',
                                        borderBottom: `1px solid ${theme.border}`,
                                        background: notif.lu ? theme.paper : (isDarkMode ? '#1e293b' : '#eff6ff'),
                                        cursor: 'pointer',
                                        transition: 'background 0.2s'
                                    }}
                                    onClick={() => !notif.lu && handleMarkAsRead(notif._id, { stopPropagation: () => { } })}
                                >
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                        <div style={{ fontSize: '18px', marginTop: '2px' }}>{getIconApi(notif.type)}</div>
                                        <div style={{ flex: 1 }}>
                                            <p style={{
                                                margin: '0 0 4px 0',
                                                fontSize: '14px',
                                                fontWeight: notif.lu ? '500' : '700',
                                                color: theme.text
                                            }}>
                                                {notif.titre}
                                            </p>
                                            <p style={{ margin: 0, fontSize: '13px', color: theme.textSecondary, lineHeight: '1.4' }}>
                                                {notif.message}
                                            </p>
                                            <span style={{ fontSize: '11px', color: theme.textSecondary, marginTop: '6px', display: 'block' }}>
                                                {new Date(notif.createdAt).toLocaleDateString()} à {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        {!notif.lu && (
                                            <div style={{
                                                width: '8px',
                                                height: '8px',
                                                borderRadius: '50%',
                                                background: '#3b82f6',
                                                marginTop: '6px'
                                            }}></div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
