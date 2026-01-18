'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeDisplayProps {
    value: string;
    size?: number;
}

export default function QRCodeDisplay({ value, size = 200 }: QRCodeDisplayProps) {
    const [qrCodeUrl, setQrCodeUrl] = useState('');

    useEffect(() => {
        QRCode.toDataURL(value, {
            width: size,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF',
            },
        })
            .then(setQrCodeUrl)
            .catch(console.error);
    }, [value, size]);

    if (!qrCodeUrl) {
        return <div className="w-[200px] h-[200px] bg-white/10 rounded-lg animate-pulse" />;
    }

    return (
        <div className="bg-white p-4 rounded-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrCodeUrl} alt="QR Code" className="w-full h-full" />
        </div>
    );
}
