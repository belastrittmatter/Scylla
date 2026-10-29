"use client";

import * as React from "react";

export function LandingVideoModal() {
  return (
    <>
      {/* Hidden video modal popup container */}
      <div
        id="videoModal"
        className="fixed inset-0 z-[999999] hidden bg-black/60 backdrop-blur-2xl items-center justify-center"
      >
        <video
          id="modalVideo"
          className="max-w-[90%] max-h-[90%] rounded-20 shadow-2xl"
          controls
          autoPlay
          muted
        >
          <source src="/media/about.mp4" type="video/mp4" />
        </video>
        <button
          id="closeVideoModal"
          aria-label="Close modal"
          className="absolute top-5 right-5 text-white text-3xl font-bold leading-none cursor-pointer"
        >
          <svg width="20px" height="20px" viewBox="0 0 24 24" fill="none">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M5.29289 5.29289C5.68342 4.90237 6.31658 4.90237 6.70711 5.29289L12 10.5858L17.2929 5.29289C17.6834 4.90237 18.3166 4.90237 18.7071 5.29289C19.0976 5.68342 19.0976 6.31658 18.7071 6.70711L13.4142 12L18.7071 17.2929C19.0976 17.6834 19.0976 18.3166 18.7071 18.7071C18.3166 19.0976 17.6834 19.0976 17.2929 18.7071L12 13.4142L6.70711 18.7071C6.31658 19.0976 5.68342 19.0976 5.29289 18.7071C4.90237 18.3166 4.90237 17.6834 5.29289 17.2929L10.5858 12L5.29289 6.70711C4.90237 6.31658 4.90237 5.68342 5.29289 5.29289Z"
              fill="#fff"
            />
          </svg>
        </button>
      </div>
    </>
  );
}
export { LandingVideoModal as VideoModal };
