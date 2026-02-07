"use client";

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-900 to-red-900">
            <div className="text-center text-white">
                <h1 className="text-6xl font-bold mb-4">404</h1>
                <p className="text-xl mb-8">Page not found</p>
                <a href="/" className="px-6 py-3 bg-pink-500 rounded-lg hover:bg-pink-600 transition-colors">
                    Go Home
                </a>
            </div>
        </div>
    );
}
