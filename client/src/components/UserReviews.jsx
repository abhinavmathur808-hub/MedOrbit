import { useReducedMotion } from 'framer-motion';

// Mock social proof: patients on the speed and the AI triage, doctors on the
// practice side, so the wall reads as a two-sided marketplace rather than a
// patient-only testimonial reel.
const REVIEWS = [
    {
        name: 'Amit Sharma',
        role: 'Software Engineer',
        text: 'Very helpful. Far easier than doing the same things on a computer. Quick search, speedy booking, and it even keeps a history of every doctor I have visited.',
        stars: 5,
        tint: 'from-rose-500 to-rose-800',
    },
    {
        name: 'Dr. Anaya Rao',
        role: 'Cardiologist',
        text: 'My calendar fills itself now. Patients arrive already routed to the right specialty, so I spend consultations treating people instead of redirecting them.',
        stars: 5,
        tint: 'from-sky-500 to-sky-800',
    },
    {
        name: 'Priya Kapoor',
        role: 'Mother of two',
        text: 'I used to spend hours calling clinics. With MedOrbit I booked a pediatrician for my son in under two minutes. The appointment reminders are a lifesaver.',
        stars: 5,
        tint: 'from-violet-500 to-violet-800',
    },
    {
        name: 'Arjun Menon',
        role: 'Patient',
        text: 'I typed what I was feeling in plain English and it pointed me to a neurologist before I had finished my coffee. It never felt like filling out a form.',
        stars: 5,
        tint: 'from-emerald-500 to-emerald-800',
    },
    {
        name: 'Rahul Verma',
        role: 'Business Analyst',
        text: 'Finding a good neurologist in my area was always a struggle. The search filters put the right expert in front of me instantly.',
        stars: 4,
        tint: 'from-amber-500 to-amber-800',
    },
    {
        name: 'Dr. Imran Qureshi',
        role: 'Neurologist',
        text: 'The onboarding took an afternoon. No front desk software to rip out, no training. My no-show rate has dropped noticeably since the reminders went live.',
        stars: 5,
        tint: 'from-orange-500 to-orange-800',
    },
    {
        name: 'Sneha Gupta',
        role: 'Student',
        text: 'Sudden severe toothache, needed someone immediately. Found a dentist available in thirty minutes. The whole booking took three taps.',
        stars: 5,
        tint: 'from-rose-500 to-rose-800',
    },
    {
        name: 'Dr. Meera Iyer',
        role: 'Dermatologist',
        text: 'Patients turn up with a clear history already attached. That context is worth more to me than any scheduling feature I have used before.',
        stars: 5,
        tint: 'from-sky-500 to-sky-800',
    },
    {
        name: 'Kavya Nair',
        role: 'Patient',
        text: 'What sold me is that the symptom check runs on my own phone. I did not have to hand my medical history to a server just to find a doctor.',
        stars: 5,
        tint: 'from-violet-500 to-violet-800',
    },
    {
        name: 'Dr. Vikram Sethi',
        role: 'Orthopedic Surgeon',
        text: 'Rescheduling used to eat an hour of my staff time every morning. It now handles itself, and the video consults mean fewer wasted trips for follow-ups.',
        stars: 4,
        tint: 'from-emerald-500 to-emerald-800',
    },
];

// Two rows travelling opposite ways read as a wall rather than one long belt.
const ROW_ONE = REVIEWS.slice(0, 5);
const ROW_TWO = REVIEWS.slice(5);

const initials = (name) =>
    name
        .replace(/^Dr\.?\s*/, '')
        .split(' ')
        .map((word) => word[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

const ReviewCard = ({ review }) => (
    // The right margin is deliberate rather than a `gap` on the track: the loop
    // below shifts by exactly -50%, which only lands seamlessly if every copy is
    // the same width *including* the space that follows its last card. A gap sits
    // only *between* children, so the track would come up half a gap short and
    // snap once per lap.
    <figure className="mr-5 flex h-full w-80 flex-shrink-0 cursor-pointer flex-col gap-3 rounded-2xl border border-zinc-800/50 bg-zinc-900/40 p-5 backdrop-blur-md transition-all duration-300 hover:scale-[1.02] hover:border-zinc-600 hover:bg-zinc-800/60 hover:shadow-xl hover:shadow-black/50">
        <blockquote className="text-sm leading-relaxed text-zinc-400">{review.text}</blockquote>

        <figcaption className="mt-auto flex items-center gap-3 pt-1">
            <span
                aria-hidden="true"
                className={`grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-gradient-to-br ${review.tint} text-[11px] font-bold text-white`}
            >
                {initials(review.name)}
            </span>
            <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{review.name}</p>
                <p className="truncate text-xs text-zinc-500">{review.role}</p>
            </div>
        </figcaption>
    </figure>
);

// One row of the wall. The track holds two identical copies and slides by half
// its own width (see the keyframes in index.css), so the moment it resets, copy
// two is sitting exactly where copy one began — no snap, and no hard-coded pixel
// distance to keep in sync with the card width or the number of reviews.
//
// `animationClass` arrives as a complete literal string rather than being built
// from a duration prop: Tailwind only emits classes it can find whole in the
// source, so an interpolated `animate-[marquee-left_${duration}s...]` would
// compile to nothing.
const MarqueeRow = ({ items, animationClass }) => {
    const reduce = useReducedMotion();

    if (reduce) {
        // No infinite travel: one copy, and the reader scrolls it themselves.
        return (
            <div className="flex overflow-x-auto pb-2">
                {items.map((review) => (
                    <ReviewCard key={review.name} review={review} />
                ))}
            </div>
        );
    }

    return (
        // Pausing on hover is what makes a moving quote readable at all — and it
        // pauses only the row under the cursor, since each track owns its own
        // animation.
        <div className={`flex w-max ${animationClass} hover:[animation-play-state:paused]`}>
            {items.map((review) => (
                <ReviewCard key={review.name} review={review} />
            ))}
            {/* The second copy exists only to fill the gap the first leaves as it
                travels — it is the same quotes again, so it is hidden from
                screen readers rather than read out twice. */}
            <span className="flex" aria-hidden="true">
                {items.map((review) => (
                    <ReviewCard key={review.name} review={review} />
                ))}
            </span>
        </div>
    );
};

const UserReviews = () => (
    <section className="relative w-full py-24">
        {/* Ambient backlight — breaks up the flat black behind the rows. It sits
            outside the masked wrapper so the mask doesn't clip it, and the cards'
            backdrop-blur picks it up through the glass. */}
        <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-900/20 blur-[120px]"
        />

        {/* Header alignment mirrors TopArticles/FAQ exactly: an outer gutter
            (px-6 md:px-12) then max-w-6xl mx-auto inside it. The section itself
            stays gutter-less so the marquee below can go full-bleed via -mx-*,
            so the padding has to live on this wrapper instead of the section —
            without it the centred box lands 48px right of the other sections at
            wide viewports. */}
        <div className="px-6 md:px-12">
            <div className="mx-auto mb-14 max-w-6xl">
                <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                    What Our <span className="text-rose-500">Users</span> Say
                </h2>
                <p className="mt-3 text-sm text-zinc-500 sm:text-base">
                    Trusted by patients and doctors across the country.
                </p>
            </div>
        </div>

        {/* Full-bleed: the negative margin cancels the page gutter so the rows
            run to the viewport edge and the mask has room to fade them out
            there, instead of clipping hard against the content column. */}
        <div className="-mx-6 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)] md:-mx-12">
            <div className="flex flex-col gap-5">
                <MarqueeRow items={ROW_ONE} animationClass="animate-[marquee-left_44s_linear_infinite]" />
                <MarqueeRow items={ROW_TWO} animationClass="animate-[marquee-right_52s_linear_infinite]" />
            </div>
        </div>
    </section>
);

export default UserReviews;
