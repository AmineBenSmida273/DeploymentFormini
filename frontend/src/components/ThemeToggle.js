import React from 'react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = () => {
    const { isDarkMode, toggleTheme, theme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            style={styles.toggleBtn(theme, isDarkMode)}
            title="Toggle Dark Mode"
        >
            <div style={styles.toggleCircle(theme, isDarkMode)}>
                {isDarkMode ? '🌙' : '☀️'}
            </div>
        </button>
    );
};

const styles = {
    toggleBtn: (theme, isDarkMode) => ({
        width: '50px',
        height: '26px',
        background: isDarkMode ? theme.primary : theme.border,
        borderRadius: '13px',
        border: 'none',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 0.3s',
        display: 'flex',
        alignItems: 'center',
        padding: 0,
        outline: 'none',
    }),
    toggleCircle: (theme, isDarkMode) => ({
        width: '22px',
        height: '22px',
        background: theme.paper,
        borderRadius: '50%',
        position: 'absolute',
        left: isDarkMode ? '26px' : '2px',
        transition: 'left 0.3s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '12px',
    }),
};

export default ThemeToggle;
