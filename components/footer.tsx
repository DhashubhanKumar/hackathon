export function Footer() {
    return (
        <footer className="w-full py-8 mt-20 border-t border-white/10 bg-black/40 backdrop-blur-lg">
            <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
                <p>&copy; {new Date().getFullYear()} EventHorizon. All rights reserved.</p>
                <p className="mt-2">Powered by AI & Glassmorphism</p>
            </div>
        </footer>
    );
}
