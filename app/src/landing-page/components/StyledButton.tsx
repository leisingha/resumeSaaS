import React from 'react';
import styled from 'styled-components';
import { Link } from 'wasp/client/router';

interface StyledButtonProps {
  to: any; // Changed from string to any to accommodate Wasp route types
  children: React.ReactNode;
}

const StyledButton = ({ to, children }: StyledButtonProps) => {
  return (
    <StyledWrapper>
      <Link to={to}>
        <button>{children}</button>
      </Link>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  button {
    background: #1A222C;
    font-family: inherit;
    padding: 0.6em 1.3em;
    font-weight: 900;
    font-size: 18px;
    border: 3px solid #fbca1f;
    border-radius: 0.4em;
    box-shadow: 0.1em 0.1em #fbca1f;
    cursor: pointer;
    text-decoration: none;
    color: white;
  }

  button:hover {
    transform: translate(-0.05em, -0.05em);
    box-shadow: 0.15em 0.15em #fbca1f;
  }

  button:active {
    transform: translate(0.05em, 0.05em);
    box-shadow: 0.05em 0.05em #fbca1f;
  }

  a {
    text-decoration: none;
  }
`;

export default StyledButton;
