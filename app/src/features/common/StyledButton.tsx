import React from 'react';
import styled from 'styled-components';

interface StyledButtonProps {
  onClick: () => void;
  text: string;
  variant?: 'default' | 'gradient';
}

const StyledButton: React.FC<StyledButtonProps> = ({ onClick, text, variant = 'default' }) => {
  return (
    <StyledWrapper variant={variant}>
      <button onClick={onClick}>
        <span className="text">{text}</span>
      </button>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div<{ variant: 'default' | 'gradient' }>`
  width: 100%;
  
  button {
    align-items: center;
    background-image: linear-gradient(144deg, #af40ff, #5b42f3 50%, #00ddeb);
    border: 0;
    border-radius: 8px;
    box-shadow: rgba(151, 65, 252, 0.2) 0 15px 30px -5px;
    box-sizing: border-box;
    color: #ffffff;
    display: flex;
    font-size: 18px;
    justify-content: center;
    line-height: 1em;
    width: 100%; /* Changed from max-width to width */
    min-width: 140px;
    padding: 3px;
    text-decoration: none;
    user-select: none;
    -webkit-user-select: none;
    touch-action: manipulation;
    white-space: nowrap;
    cursor: pointer;
    transition: all 0.3s;
  }

  button:active,
  button:hover {
    outline: 0;
  }

  button:hover {
    transform: scale(1.02);
  }

  button span {
    background-color: ${(props) => (props.variant === 'gradient' ? 'transparent' : '#F1F5F9')};
    padding: 16px 24px;
    border-radius: 6px;
    width: 100%;
    height: 100%;
    transition: 300ms;
  }

  @media (prefers-color-scheme: dark) {
    button span {
      background-color: ${(props) => (props.variant === 'gradient' ? 'transparent' : '#1A222C')};
    }
  }

  button:hover span {
    background: none;
  }

  button:active {
    transform: scale(0.9);
  }
`;

export default StyledButton; 