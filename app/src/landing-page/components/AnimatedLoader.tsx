import React from "react";
import styled from "styled-components";

const AnimatedLoader = () => {
  return (
    <StyledWrapper>
      <div className="card">
        <div className="loader">
          <p>Cut through the hiring BS. Tailored for every</p>
          <div className="words">
            <span className="word">Student</span>
            <span className="word">Software Engineer</span>
            <span className="word">Product Manager</span>
            <span className="word">Data Analyst</span>
            <span className="word">Designer</span>
            <span className="word">Marketer</span>
            <span className="word">Sales Executive</span>
            <span className="word">Consultant</span>
            <span className="word">Teacher</span>
            <span className="word">Entrepreneur</span>
          </div>
        </div>
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .card {
    /* color used to softly clip top and bottom of the .words container */
    --bg-color: transparent;
    background-color: var(--bg-color);
    padding: 0;
    border-radius: 0;
  }
  .loader {
    color: rgb(156, 156, 156);
    font-family: inherit;
    font-weight: 400;
    font-size: 16px;
    line-height: 1.5;
    -webkit-box-sizing: content-box;
    box-sizing: content-box;
    height: auto;
    padding: 0;
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    flex-direction: column;
    align-items: center;
    border-radius: 0;
  }

  .loader p {
    white-space: nowrap;
    margin: 0;
  }

  @media (min-width: 640px) {
    .loader {
      font-size: 18px;
      flex-direction: row;
      gap: 4px;
      align-items: baseline;
    }
    .words {
      height: 27px;
      margin-top: 0;
    }
  }

  @media (min-width: 768px) {
    .loader {
      font-size: 20px;
    }
    .words {
      height: 30px;
    }
  }

  .words {
    overflow: hidden;
    position: relative;
    text-align: left;
    height: 24px;
    margin-top: 4px;
  }
  .words::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(
      transparent 10%,
      transparent 30%,
      transparent 70%,
      transparent 90%
    );
    z-index: 20;
  }

  .word {
    display: block;
    height: 100%;
    padding-left: 6px;
    background: linear-gradient(to right, #d946ef, #fc0);
    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
    animation: spin_4991 10s infinite;
    text-align: left;
    width: auto;
    min-width: 0;
    line-height: 1.5;
  }

  @keyframes spin_4991 {
    0%,
    8% {
      transform: translateY(0%);
    }
    10%,
    18% {
      transform: translateY(-100%);
    }
    20%,
    28% {
      transform: translateY(-200%);
    }
    30%,
    38% {
      transform: translateY(-300%);
    }
    40%,
    48% {
      transform: translateY(-400%);
    }
    50%,
    58% {
      transform: translateY(-500%);
    }
    60%,
    68% {
      transform: translateY(-600%);
    }
    70%,
    78% {
      transform: translateY(-700%);
    }
    80%,
    88% {
      transform: translateY(-800%);
    }
    90%,
    98% {
      transform: translateY(-900%);
    }
    100% {
      transform: translateY(-1000%);
    }
  }
`;

export default AnimatedLoader;
