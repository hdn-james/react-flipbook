import React, { useRef } from "react";
import Flipbook from "../src/components/Flipbook";
import type { FlipbookInstance, FlipbookPage } from "../src/types";
import "../src/styles/flipbook.css";

// Sample pages using placehold.co
const samplePages: FlipbookPage[] = [
  {
    src: "https://placehold.co/800x600/FF6B6B/ffffff?text=Page+1+-+Cover",
    title: "Cover",
  },
  {
    src: "https://placehold.co/800x600/4ECDC4/ffffff?text=Page+2+-+Introduction",
    title: "Introduction",
  },
  {
    src: "https://placehold.co/800x600/45B7D1/ffffff?text=Page+3+-+Chapter+1",
    title: "Chapter 1",
  },
  {
    src: "https://placehold.co/800x600/96CEB4/ffffff?text=Page+4+-+Chapter+2",
    title: "Chapter 2",
  },
  {
    src: "https://placehold.co/800x600/FFEAA7/333333?text=Page+5+-+Chapter+3",
    title: "Chapter 3",
  },
  {
    src: "https://placehold.co/800x600/DDA0DD/ffffff?text=Page+6+-+Conclusion",
    title: "Conclusion",
  },
];

const BasicExample: React.FC = () => {
  const flipbookRef = useRef<FlipbookInstance>(null);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#1a1a2e",
        padding: "20px",
        boxSizing: "border-box",
      }}
    >
      <h1 style={{ color: "white", marginBottom: "20px" }}>
        React 3D Flipbook - Basic Example
      </h1>

      {/* External controls */}
      <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
        <button
          onClick={() => flipbookRef.current?.firstPage()}
          style={{
            padding: "10px 20px",
            borderRadius: "4px",
            border: "none",
            background: "#4ECDC4",
            color: "white",
            cursor: "pointer",
          }}
        >
          First Page
        </button>
        <button
          onClick={() => flipbookRef.current?.prevPage()}
          style={{
            padding: "10px 20px",
            borderRadius: "4px",
            border: "none",
            background: "#45B7D1",
            color: "white",
            cursor: "pointer",
          }}
        >
          Previous
        </button>
        <button
          onClick={() => flipbookRef.current?.nextPage()}
          style={{
            padding: "10px 20px",
            borderRadius: "4px",
            border: "none",
            background: "#45B7D1",
            color: "white",
            cursor: "pointer",
          }}
        >
          Next
        </button>
        <button
          onClick={() => flipbookRef.current?.lastPage()}
          style={{
            padding: "10px 20px",
            borderRadius: "4px",
            border: "none",
            background: "#4ECDC4",
            color: "white",
            cursor: "pointer",
          }}
        >
          Last Page
        </button>
      </div>

      {/* Flipbook component */}
      <Flipbook
        ref={flipbookRef}
        pages={samplePages}
        width={800}
        height={500}
        skin="dark"
        backgroundColor="#2d2d44"
        startPage={1}
        sideNavigationButtons={true}
        onPageFlip={(e) => console.log("Page flipped:", e)}
        onZoomChange={(e) => console.log("Zoom changed:", e)}
        onReady={() => console.log("Flipbook ready!")}
      />
    </div>
  );
};

export default BasicExample;
