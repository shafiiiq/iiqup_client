import React, { useState, useEffect } from 'react';
import './Explore.css';
import Button from '../../common/Button/Button';
import { useNavigate } from 'react-router-dom';
import { END_POINT } from '../../constants';
import { apiRequest } from '../../utils/0auth';

function Explore() {
  const navigate = useNavigate();
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0);
  const [features, setFeatures] = useState([]);
  const [releaseId, setReleaseId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasExploredThisVersion, setHasExploredThisVersion] = useState(false);

  useEffect(() => {
    const fetchFeatures = async () => {
      try {
        setIsLoading(true);
        const response = await apiRequest(`${END_POINT}/explorer/get-latest-release-for-user`, 'GET');
        const data = await response.json();

        console.log("data", data);

        // Handle no data
        if (data.status !== 200 || !data.data) {
          navigate('/');
          return;
        }

        const release = data.data;

        // Already explored
        if (release.hasExploredThisVersion) {
          navigate('/');
          return;
        }

        // No features
        if (!release.features || release.features.length === 0) {
          navigate('/');
          return;
        }

        setReleaseId(release._id);

        const featuresWithVideos = await Promise.all(
          release.features.map(async (feature) => {
            try {
              const s3Response = await apiRequest(
                `${END_POINT}/s3Config/get-pre-signed-url`,
                'POST',
                { key: feature.videoUrl, isLong: true }
              );
              const s3Data = await s3Response.json();

              return {
                id: feature._id,
                headline: feature.headline,
                description: feature.description,
                videoUrl: s3Data.dataUrl || '',
                highlights: feature.highlights,
                releaseVersion: release.releaseVersion,
                releaseDate: new Date(release.releaseDate).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric'
                }),
                isExplored: feature.isExplored
              };
            } catch (err) {
              console.error('Error fetching video URL:', err);
              return null;
            }
          })
        );

        const validFeatures = featuresWithVideos.filter(f => f !== null);

        if (validFeatures.length === 0) {
          navigate('/');
          return;
        }

        setFeatures(validFeatures);
      } catch (err) {
        console.error('Error fetching features:', err);
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeatures();
  }, [navigate]);

  const currentFeature = features[currentFeatureIndex];

  const markCurrentFeatureAsExplored = async () => {
    try {
      await apiRequest(`${END_POINT}/explorer/mark-feature-explored`, 'POST', {
        releaseId: releaseId,
        featureId: currentFeature.id
      });
    } catch (err) {
      console.error('Error marking feature as explored:', err);
    }
  };

  const handleNext = async () => {
    await markCurrentFeatureAsExplored();

    if (currentFeatureIndex < features.length - 1) {
      setCurrentFeatureIndex(currentFeatureIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentFeatureIndex > 0) {
      setCurrentFeatureIndex(currentFeatureIndex - 1);
    }
  };

  const handleGetStarted = async () => {
    await markCurrentFeatureAsExplored();
    navigate('/');
  };

  const handleSkip = () => {
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="explore-container">
        <div className="explore-background-gradient"></div>
        <div className="explore-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <div style={{ textAlign: 'center', color: '#fff' }}>
            <div className="loading-spinner"></div>
            <p style={{ marginTop: '20px' }}>Loading features...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="explore-container">
      <div className="explore-background-gradient"></div>

      <div className="explore-content">
        <div className="explore-header">
          <div className="explore-logo">
            <div className="explore-logo-icon">
              <svg xmlns="http://www.w3.org/2000/svg" height="100px" width="100px" viewBox="0 -960 960 960" fill="#e3e3e3"><path d="M219.54-299.54Q167-352.18 138.88-419.13q-28.11-66.96-28.11-140.84 0-73.88 28.11-140.85Q167-767.8 219.54-820.46L246-794q-47 47-72.5 107.5T148-560q0 66 25.5 126.5T246-326l-26.46 26.46Zm92-92q-33.5-33.69-51.14-77.12-17.63-43.44-17.63-91.31 0-47.88 17.63-91.33 17.64-43.46 51.14-77.16L338-702q-29 29-43.5 65.5T280-560q0 40 14.5 76.5T338-418l-26.46 26.46ZM460-155.38v-331.08q-25.46-5.85-41.19-26.23-15.73-20.39-15.73-47.31 0-32.31 22.46-54.62 22.46-22.3 54.46-22.3t54.46 22.3q22.46 22.31 22.46 54.62 0 26.92-15.73 47.31-15.73 20.38-41.19 26.23v331.08h-40Zm188.46-236.16L622-418q29-29 43.5-65.5T680-560q0-40-14.5-76.5T622-702l26.46-26.46q33.5 33.69 51.14 77.12 17.63 43.44 17.63 91.31 0 47.88-17.63 91.33-17.64 43.46-51.14 77.16Zm92 92L714-326q47-47 72.5-107.5T812-560q0-66-25.5-126.5T714-794l26.46-26.46q52.54 52.64 80.66 119.59 28.11 66.96 28.11 140.84 0 73.88-28.11 140.85Q793-352.2 740.46-299.54Z" /></svg>
            </div>
            <h1 className="explore-title">What's New</h1>
          </div>
          <button className="explore-skip-btn" onClick={handleSkip}>
            Skip Tour →
          </button>
        </div>

        <div className="explore-main">
          <div className="explore-video-section">
            <div className="explore-video-wrapper">
              {currentFeature?.videoUrl ? (
                <video
                  className="explore-video"
                  src={currentFeature.videoUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  key={currentFeature.id}
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="no-video-placeholder">
                  <p>Video not available</p>
                </div>
              )}
            </div>

            <div className="explore-counter">
              <span className="explore-counter-current">{currentFeatureIndex + 1}</span>
              <span className="explore-counter-separator">/</span>
              <span className="explore-counter-total">{features.length}</span>
            </div>
          </div>

          <div className="explore-details-section">
            <div className="explore-badge">
              <span className="explore-badge-text">
                <span className="explore-badge-v">v</span>
                <span className="explore-badge-version">{currentFeature?.releaseVersion || 'New Feature'}</span>
              </span>
              <span className="explore-badge-date">{currentFeature?.releaseDate}</span>
            </div>

            <h2 className="explore-headline">{currentFeature?.headline}</h2>
            <p className="explore-description">{currentFeature?.description}</p>

            <div className="explore-highlights">
              <h3 className="explore-highlights-title">Key Highlights</h3>
              <ul className="explore-highlights-list">
                {currentFeature?.highlights.map((highlight, index) => (
                  <li key={index} className="explore-highlight-item">
                    <span className="explore-highlight-icon">new</span>
                    <span className="explore-highlight-text">{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="explore-progress">
              {features.map((_, index) => (
                <button
                  key={index}
                  className={`explore-progress-dot ${index === currentFeatureIndex ? 'active' : ''} ${index < currentFeatureIndex ? 'completed' : ''}`}
                  onClick={() => setCurrentFeatureIndex(index)}
                  aria-label={`Go to feature ${index + 1}`}
                ></button>
              ))}
            </div>

            <div className="explore-navigation">
              <Button
                text="Previous"
                onClick={handlePrevious}
                colorScheme="white-400"
                variant="gradient"
                font="2xl"
                squircle="3xl"
                width="150px"
                height="55px"
                type={currentFeatureIndex === 0 ? "disabled" : "button"}
                cursor={currentFeatureIndex === 0 ? "not-allowed" : "pointer"}
                textColor="yellow-800"
                shadowPosition="to-bottom"
                shadowColor="white-600"
              />

              {currentFeatureIndex === features.length - 1 ? (
                <Button
                  text="Get Started"
                  onClick={handleGetStarted}
                  colorScheme="yellow-400"
                  variant="gradient"
                  font="2xl"
                  squircle="3xl"
                  width="200px"
                  height="55px"
                  type="button"
                  textColor="black-200"
                  shadowPosition="to-bottom"
                  shadowColor="yellow-600"
                />
              ) : (
                <Button
                  text="Next"
                  onClick={handleNext}
                  colorScheme="yellow-400"
                  variant="gradient"
                  font="2xl"
                  squircle="3xl"
                  width="150px"
                  height="55px"
                  type="button"
                  textColor="black-200"
                  shadowPosition="to-bottom"
                  shadowColor="yellow-600"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Explore;