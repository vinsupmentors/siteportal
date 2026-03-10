import React from 'react';

// Strict specification ensuring NO AI Emojis. Pure SVG generation.
export const BrandLogo = () => (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 2L30 9V23L16 30L2 23V9L16 2Z" fill="url(#paint0_linear)" />
        <path d="M16 11L21.5 14V17.5L16 20.5L10.5 17.5V14L16 11Z" fill="white" />
        <defs>
            <linearGradient id="paint0_linear" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
                <stop stopColor="#4C6EF5" />
                <stop offset="1" stopColor="#15AABF" />
            </linearGradient>
        </defs>
    </svg>
);
