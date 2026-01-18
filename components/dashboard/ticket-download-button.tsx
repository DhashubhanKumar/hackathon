'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { downloadElementAsPDF } from '@/lib/pdf-utils';
import { TicketPoster } from './ticket-poster';

interface TicketDownloadButtonProps {
    booking: {
        id: string;
        event: {
            title: string;
            description: string;
            location: string;
            startDate: Date;
            imageUrl: string | null;
            category: string | null;
        };
        ticket: {
            qrToken: string;
        };
    };
}

export function TicketDownloadButton({ booking }: TicketDownloadButtonProps) {
    const [downloading, setDownloading] = useState(false);

    const handleDownload = async () => {
        setDownloading(true);
        try {
            await downloadElementAsPDF(`ticket-poster-${booking.id}`, `Ticket-${booking.event.title.replace(/\s+/g, '-')}`);
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="relative">
            {/* Hidden Poster for PDF Capture */}
            <TicketPoster booking={booking} />

            <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800/50 text-white text-sm font-semibold transition-all group shadow-lg shadow-blue-900/20"
            >
                {downloading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                )}
                {downloading ? 'Generating PDF...' : 'Download Ticket'}
            </button>
        </div>
    );
}
