import React, { useState } from 'react'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'

const reviews = [
  {
    id: 1,
    name: "Amit Sharma",
    role: "Software Engineer",
    text: "Very helpful. Far easier than doing same things on computer. Allows quick and easy search with speedy booking. Even maintains history of doctors visited.",
    stars: 5
  },
  {
    id: 2,
    name: "Priya Kapoor",
    role: "Mother of two",
    text: "I used to spend hours calling clinics. With MedOrbit, I booked a pediatrician for my son in under 2 minutes. The appointment reminders are a lifesaver!",
    stars: 5
  },
  {
    id: 3,
    name: "Rahul Verma",
    role: "Business Analyst",
    text: "Finding a good Neurologist in my area was always a struggle until now. The search filters helped me find the right expert near me instantly.",
    stars: 4
  },
  {
    id: 4,
    name: "Sneha Gupta",
    role: "Student",
    text: "Had a sudden severe toothache and needed a dentist immediately. Found one available in 30 minutes through this app. The booking process was seamless.",
    stars: 5
  }
]

const UserReviews = () => {
  const [currentIndex, setCurrentIndex] = useState(0)

  const nextReview = () => {
    setCurrentIndex((prevIndex) => (prevIndex === reviews.length - 1 ? 0 : prevIndex + 1))
  }

  const prevReview = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? reviews.length - 1 : prevIndex - 1))
  }

  return (
    <div className='w-full py-32 relative overflow-hidden'>

      <div className='max-w-6xl mx-auto px-4 relative flex items-center justify-center'>

        <button
          onClick={prevReview}
          className='hidden md:flex absolute left-2 md:left-6 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center rounded-full bg-zinc-800/50 hover:bg-rose-600 text-zinc-400 hover:text-white backdrop-blur-sm border border-zinc-700/50 hover:border-rose-500 transition-all z-20'
          aria-label="Previous Review"
        >
          <FiChevronLeft className='w-6 h-6' />
        </button>

        <div
          className='relative w-full max-w-2xl rounded-2xl p-10 sm:p-16 text-center transition-all duration-300 ease-out'
          style={{
            minHeight: '400px',
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            boxShadow: 'var(--card-shadow)',
          }}
        >

          <div
            className='absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 z-10 flex items-center justify-center rounded-full bg-rose-600'
            style={{ boxShadow: '0 8px 20px rgba(225, 29, 72, 0.3)' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white">
              <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
            </svg>
          </div>

          <div className='flex flex-col items-center justify-center h-full mt-4'>

            <h2 className='text-3xl sm:text-4xl font-semibold tracking-tight text-white mb-10'>
              What Our Users Say
            </h2>

            <div className='px-2 sm:px-8 transition-opacity duration-300'>
              <p className='text-zinc-400 text-lg sm:text-xl leading-relaxed mb-8'>
                "{reviews[currentIndex].text}"
              </p>

              <div className='flex flex-col items-center gap-3'>
                <div className='flex text-2xl gap-1 mb-2'>
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={i < reviews[currentIndex].stars ? 'text-rose-500' : 'text-zinc-700'}>★</span>
                  ))}
                </div>

                <h3 className='font-medium text-white text-lg uppercase tracking-widest border-t border-white/[0.06] pt-4 px-6'>
                  {reviews[currentIndex].name}
                </h3>
                <p className='text-zinc-600 text-sm uppercase tracking-wide'>
                  {reviews[currentIndex].role}
                </p>
              </div>
            </div>

          </div>

          <div className='absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3'>
            {reviews.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentIndex ? 'bg-rose-600 scale-125' : 'bg-zinc-700 hover:bg-zinc-500'
                  }`}
                aria-label={`Go to review ${index + 1}`}
              />
            ))}
          </div>

        </div>

        <button
          onClick={nextReview}
          className='hidden md:flex absolute right-2 md:right-6 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center rounded-full bg-zinc-800/50 hover:bg-rose-600 text-zinc-400 hover:text-white backdrop-blur-sm border border-zinc-700/50 hover:border-rose-500 transition-all z-20'
          aria-label="Next Review"
        >
          <FiChevronRight className='w-6 h-6' />
        </button>

      </div>

      <div className='flex justify-center gap-6 mt-8 md:hidden'>
        <button onClick={prevReview} className='w-10 h-10 flex items-center justify-center rounded-full bg-zinc-800/50 hover:bg-rose-600 text-zinc-400 hover:text-white backdrop-blur-sm border border-zinc-700/50 hover:border-rose-500 transition-all' aria-label='Previous Review'>
          <FiChevronLeft className='w-5 h-5' />
        </button>
        <button onClick={nextReview} className='w-10 h-10 flex items-center justify-center rounded-full bg-zinc-800/50 hover:bg-rose-600 text-zinc-400 hover:text-white backdrop-blur-sm border border-zinc-700/50 hover:border-rose-500 transition-all' aria-label='Next Review'>
          <FiChevronRight className='w-5 h-5' />
        </button>
      </div>

    </div>
  )
}

export default UserReviews