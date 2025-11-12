'use client';

import { useState, FormEvent } from 'react';

export default function TestimonyPage() {
  const [formData, setFormData] = useState({
    // Personal Information
    name: '',
    email: '',
    phone: '',
    location: '',
    ageRange: '',
    socialHandles: '',

    // Testimony
    story_before: '',
    story_encounter: '',
    story_after: '',
    scripture_anchor: '',
    core_message: '',

    // Media & Consent
    on_camera: false,
    media_consent: false,

    // Next Steps
    referral_source: '',
    join_future_projects: false,
    prayer_request: '',
    contact_preference: 'Email',
  });

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      const res = await fetch('/api/testimonies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit testimony');
      }

      setStatus('success');

      // Reset form after successful submission
      setFormData({
        name: '', email: '', phone: '', location: '', ageRange: '', socialHandles: '',
        story_before: '', story_encounter: '', story_after: '', scripture_anchor: '', core_message: '',
        on_camera: false, media_consent: false,
        referral_source: '', join_future_projects: false, prayer_request: '', contact_preference: 'Email'
      });
    } catch (err) {
      console.error('Testimony submission error:', err);
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred');
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-6 text-green-600">
            <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Thank You for Sharing Your Story!</h1>
          <p className="text-lg text-gray-600 mb-6">
            Our team will review it prayerfully and reach out if it fits a current Ruach Studio series or story campaign.
          </p>
          <p className="text-md text-gray-700 mb-8">
            Your testimony releases truth — and someone&apos;s freedom may begin because of what you&apos;ve shared.
          </p>
          <button
            onClick={() => setStatus('idle')}
            className="bg-black text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Share Another Testimony
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Share Your Story — A Testimony of Transformation
          </h1>
          <p className="text-lg md:text-xl text-gray-700 mb-2">
            Every story has power. When you share what Jesus has done in your life, you release hope and truth to others.
          </p>
          <p className="text-md text-gray-600 italic">
            &ldquo;Let the redeemed of the Lord tell their story.&rdquo; — Psalm 107:2
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Section 1: Personal Information */}
          <section className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="mr-2">🧍‍♂️</span> Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">City / State</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Age Range</label>
                <select
                  name="ageRange"
                  value={formData.ageRange}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select age range</option>
                  <option value="Under 18">Under 18</option>
                  <option value="18–24">18–24</option>
                  <option value="25–34">25–34</option>
                  <option value="35–44">35–44</option>
                  <option value="45–54">45–54</option>
                  <option value="55+">55+</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Social Media Handle(s)</label>
                <input
                  type="text"
                  name="socialHandles"
                  placeholder="Instagram, YouTube, etc."
                  value={formData.socialHandles}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </section>

          {/* Section 2: Your Testimony */}
          <section className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="mr-2">✝️</span> Your Testimony
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  What was your life like before Jesus? *
                </label>
                <textarea
                  name="story_before"
                  required
                  rows={5}
                  value={formData.story_before}
                  onChange={handleChange}
                  placeholder="Encourage vulnerability and authenticity..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  What happened that led to your encounter with Him? *
                </label>
                <textarea
                  name="story_encounter"
                  required
                  rows={5}
                  value={formData.story_encounter}
                  onChange={handleChange}
                  placeholder="The turning point or defining moment..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  What has changed since then? *
                </label>
                <textarea
                  name="story_after"
                  required
                  rows={5}
                  value={formData.story_after}
                  onChange={handleChange}
                  placeholder="Describe transformation, healing, or breakthrough..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  What truth or Scripture anchors your story?
                </label>
                <input
                  type="text"
                  name="scripture_anchor"
                  value={formData.scripture_anchor}
                  onChange={handleChange}
                  placeholder='Example: Isaiah 61:3 — &quot;To give them beauty for ashes...&quot;'
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  If you could tell others one message from your story, what would it be?
                </label>
                <textarea
                  name="core_message"
                  rows={3}
                  value={formData.core_message}
                  onChange={handleChange}
                  placeholder="A single statement or declaration..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </section>

          {/* Section 3: Media & Consent */}
          <section className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="mr-2">🎥</span> Media & Consent
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Would you like to be featured on camera?
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="on_camera"
                    checked={formData.on_camera}
                    onChange={handleChange}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Yes, I&apos;m interested in being featured on camera</span>
                </div>
              </div>

              <div className="border-t pt-6">
                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    name="media_consent"
                    required
                    checked={formData.media_consent}
                    onChange={handleChange}
                    className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    <strong>Media Release Consent *</strong><br />
                    I give Ruach Studios permission to share my testimony (written, audio, or video) across Ruach channels.
                  </span>
                </label>
              </div>
            </div>
          </section>

          {/* Section 4: Next Steps */}
          <section className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="mr-2">🌍</span> Next Steps
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  How did you hear about Ruach Studios?
                </label>
                <select
                  name="referral_source"
                  value={formData.referral_source}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select one</option>
                  <option value="Friend">Friend</option>
                  <option value="Church">Church</option>
                  <option value="Social Media">Social Media</option>
                  <option value="Event">Event</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Preferred Contact Method
                </label>
                <select
                  name="contact_preference"
                  value={formData.contact_preference}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Email">Email</option>
                  <option value="Phone">Phone</option>
                  <option value="Text">Text</option>
                  <option value="None">None</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="join_future_projects"
                    checked={formData.join_future_projects}
                    onChange={handleChange}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">I&apos;d like to be part of future recordings or events</span>
                </label>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Prayer or Follow-Up Request
                </label>
                <textarea
                  name="prayer_request"
                  rows={4}
                  value={formData.prayer_request}
                  onChange={handleChange}
                  placeholder="Optional"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </section>

          {/* Error Message */}
          {status === 'error' && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
              <p className="font-semibold">Error submitting testimony</p>
              <p className="text-sm">{errorMessage || 'Please try again later.'}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="text-center">
            <button
              type="submit"
              disabled={status === 'loading'}
              className="bg-black text-white px-12 py-4 rounded-lg text-lg font-semibold hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {status === 'loading' ? 'Submitting...' : 'Share My Story'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
