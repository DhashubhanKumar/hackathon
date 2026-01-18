import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { EventForm } from '@/components/dashboard/event-form';

export default function CreateEventPage() {
    return (
        <>
            <Navbar />
            <div className="min-h-screen pt-24 px-4">
                <EventForm />
            </div>
            <Footer />
        </>
    );
}
