import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export async function downloadElementAsPDF(elementId: string, fileName: string) {
    const element = document.getElementById(elementId);
    if (!element) return;

    try {
        const canvas = await html2canvas(element, {
            scale: 2, // High quality
            useCORS: true, // Allow fetching images from other domains
            logging: false,
            backgroundColor: '#000000',
        });

        const imgData = canvas.toDataURL('image/png');

        // A4 Paper Size in points (72 points per inch)
        // 595 x 842 approx
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'px',
            format: [canvas.width / 2, canvas.height / 2], // Match canvas dimensions at scale 1
        });

        const width = pdf.internal.pageSize.getWidth();
        const height = pdf.internal.pageSize.getHeight();

        pdf.addImage(imgData, 'PNG', 0, 0, width, height);
        pdf.save(`${fileName}.pdf`);
    } catch (error) {
        console.error('Error generating PDF:', error);
    }
}
