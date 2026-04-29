import React from "react";
import "./OrbitingCircles.css";

export interface OrbitingCirclesProps {
  className?: string;
  children?: React.ReactNode;
  reverse?: boolean;
  duration?: number;
  delay?: number;
  radius?: number;
  path?: boolean;
}

export default function OrbitingCircles({
  className,
  children,
  reverse,
  duration = 20,
  delay = 10,
  radius = 50,
  path = true,
}: OrbitingCirclesProps) {
  return (
    <>
      {path && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          className="magic-orbit-svg"
          style={{
             "--radius": `${radius}px`,
          } as React.CSSProperties}
        >
          <circle cx="50%" cy="50%" r={radius} fill="none" />
        </svg>
      )}

      <div
        style={{
          "--duration": duration,
          "--radius": radius,
          "--delay": -delay,
        } as React.CSSProperties}
        className={`magic-orbit-item ${reverse ? "reverse" : ""} ${className || ""}`}
      >
        {children}
      </div>
    </>
  );
}
