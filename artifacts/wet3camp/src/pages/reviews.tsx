

import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { Star } from 'lucide-react'


export default function ReviewsPage() {
  const reviews = [
    {
      id: 1,
      client: 'John',
      escort: 'Amara',
      rating: 5,
      review: 'Excellent service! Professional and friendly. Highly recommended.',
      date: '2 weeks ago',
    },
    {
      id: 2,
      client: 'Mike',
      escort: 'Zara',
      rating: 5,
      review: 'Amazing experience. Will definitely book again!',
      date: '1 month ago',
    },
    {
      id: 3,
      client: 'Alex',
      escort: 'Maya',
      rating: 4,
      review: 'Great service. Worth the investment.',
      date: '1 month ago',
    },
  ]

  return (
    <div className="flex min-h-screen bg-dark-bg flex-col lg:flex-row">
      <Sidebar />

      <div className="flex-1 w-full overflow-x-hidden lg:pb-0 pb-24">
        <Header />

        <main className="w-full px-3 sm:px-4 py-4 sm:py-6">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-light mb-2">Reviews</h1>
            <p className="text-text-muted mb-8">Verified client reviews</p>

            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="bg-card-bg rounded-lg border border-color p-4">
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <div>
                      <p className="text-light font-bold text-sm">{review.client} reviewed {review.escort}</p>
                      <p className="text-text-muted text-xs">{review.date}</p>
                    </div>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={i < review.rating ? 'fill-secondary-color text-secondary-color' : 'text-text-muted'}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-text-light text-sm leading-relaxed">{review.review}</p>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
