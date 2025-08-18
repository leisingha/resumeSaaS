import React from 'react';
import styled from 'styled-components';

interface StyledButtonProps {
  onClick: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  text: string;
  variant?: 'default' | 'gradient' | 'secondary';
}

const StyledButton: React.FC<StyledButtonProps> = ({ onClick, text, variant = 'default' }) => {
  // Parse the text to make the ✨ emoji bigger
  const parseText = (text: string) => {
    if (text.includes('✨')) {
      const parts = text.split('✨');
      return (
        <>
          <span className="emoji">✨</span>
          {parts[1]?.trim()}
        </>
      );
    }
    return text;
  };

  return (
    <StyledWrapper variant={variant}>
      <button className="pushable" onClick={onClick}>
        <span className="edge" />
        <span className="front">{parseText(text)}</span>
      </button>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div<{ variant: 'default' | 'gradient' | 'secondary' }>`
  width: 100%;
  
  .pushable {
    position: relative;
    background: transparent;
    padding: 0px;
    border: none;
    cursor: pointer;
    outline-offset: 4px;
    outline-color: deeppink;
    transition: filter 250ms;
    -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
    width: 100%;
  }



  .edge {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    border-radius: 8px;
    background: ${(props) =>
      props.variant === 'secondary'
        ? `linear-gradient(
            to right,
            hsl(220, 9%, 46%) 0%,
            hsl(220, 9%, 56%) 8%,
            hsl(220, 9%, 46%) 92%,
            hsl(220, 9%, 36%) 100%
          )`
        : `linear-gradient(
            to right,
            hsl(248, 39%, 39%) 0%,
            hsl(248, 39%, 49%) 8%,
            hsl(248, 39%, 39%) 92%,
            hsl(248, 39%, 29%) 100%
          )`};
  }

  .front {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    border-radius: 8px;
    background: ${(props) =>
      props.variant === 'secondary' 
        ? `hsl(210, 20%, 98%)` // Light gray for light mode
        : `hsl(248, 53%, 58%)`}; // Purple for primary
    padding: 16px 32px;
    color: ${(props) =>
      props.variant === 'secondary' 
        ? `hsl(220, 9%, 46%)` // Dark gray text for light mode
        : `white`}; // White text for primary
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    font-size: 1rem;
    transform: translateY(-4px);
    transition: transform 600ms cubic-bezier(0.3, 0.7, 0.4, 1);
    text-align: center;
    width: 100%;
    box-sizing: border-box;
    height: 56px;
    min-height: 56px;
  }

  /* Dark mode support for secondary variant */
  @media (prefers-color-scheme: dark) {
    .front {
      background: ${(props) =>
        props.variant === 'secondary' 
          ? `hsl(220, 13%, 18%)` // Dark gray for dark mode
          : `hsl(248, 53%, 58%)`}; // Keep purple for primary
      color: ${(props) =>
        props.variant === 'secondary' 
          ? `hsl(220, 9%, 66%)` // Light gray text for dark mode
          : `white`}; // Keep white for primary
    }
    
    .edge {
      background: ${(props) =>
        props.variant === 'secondary'
          ? `linear-gradient(
              to right,
              hsl(220, 13%, 25%) 0%,
              hsl(220, 13%, 35%) 8%,
              hsl(220, 13%, 25%) 92%,
              hsl(220, 13%, 15%) 100%
            )`
          : `linear-gradient(
              to right,
              hsl(248, 39%, 39%) 0%,
              hsl(248, 39%, 49%) 8%,
              hsl(248, 39%, 39%) 92%,
              hsl(248, 39%, 29%) 100%
            )`};
    }
  }

  .front .emoji {
    font-size: 1.5em;
    margin-right: 0.3em;
    text-transform: none;
    line-height: 1;
  }

  .pushable:hover {
    filter: brightness(110%);
  }

  .pushable:hover .front {
    transform: translateY(-6px);
    transition: transform 250ms cubic-bezier(0.3, 0.7, 0.4, 1.5);
  }

  .pushable:active .front {
    transform: translateY(-2px);
    transition: transform 34ms;
  }



  .pushable:focus:not(:focus-visible) {
    outline: none;
  }
`;

export default StyledButton; 