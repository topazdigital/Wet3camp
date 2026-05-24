

import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'


export default function LivePage() {
  const liveProfiles = [
    {
      id: 1,
      name: 'Amara',
      age: 23,
      location: 'Lagos',
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=400&fit=crop',
      status: 'Live Now',
    },
    {
      id: 2,
      name: 'Zara',
      age: 21,
      location: 'Nairobi',
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop',
      status: 'Live Now',
    },
    {
      id: 3,
      name: 'Maya',
      age: 24,
      location: 'Accra',
      rating: 4.7,
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=400&fit=crop',
      status: 'Live Now',
    },
    {
      id: 4,
      name: 'Chara',
      age: 25,
      location: 'Kampala',
      rating: 4.6,
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=400&fit=crop',
      status: 'Live Now',
    },
  ]

  return (
    <div className="flex min-h-screen bg-dark-bg flex-col lg:flex-row">
      <Sidebar />

      <div className="flex-1 w-full overflow-x-hidden lg:pb-0 pb-24">
        <Header />

        <main className="w-full px-3 sm:px-4 py-4">
          <div className="w-full">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-light mb-1">Live Profiles</h1>
              <p className="text-text-muted text-sm">Watch escorts live now</p>
            </div>

            {/* Live Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {liveProfiles.map((profile) => (
                <div key={profile.id} className="group cursor-pointer">
                  <div className="relative rounded-lg overflow-hidden mb-3 aspect-[3/4]">
                    <img
                      src={profile.image}
                      alt={profile.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60"></div>
                    
                    {/* Live Badge */}
                    <div className="absolute top-3 left-3 bg-primary-color text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                      Live
                    </div>

                    {/* Profile Info */}
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-white font-bold text-sm">{profile.name}, {profile.age}</h3>
                      <p className="text-white text-xs">{profile.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-light font-medium">{profile.name}</span>
                    <span className="text-secondary-color">★ {profile.rating}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
