import { useEffect, useRef } from "react";
import { Prism } from "@mantine/prism";

interface CohereOutputProps {
    output: string;
}

const CohereOutput = ({ output }: CohereOutputProps) => {
    const outputContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (outputContainerRef.current) {
            outputContainerRef.current.scrollTop = outputContainerRef.current.scrollHeight;
        }
    }, [output]);

    return output ? (
        <div style={{ marginTop: "20px" }}>
            <p style={{ fontSize: "12px", color: "gray", marginBottom: "10px" }}>
                Disclaimer: The response is generated by AI and is meant for educational purposes. It may not be
                entirely accurate or exhaustive.
            </p>
            <div
                ref={outputContainerRef}
                style={{
                    maxHeight: "300px",
                    overflowY: "auto",
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "5px",
                }}
            >
                <Prism language="markdown">{output}</Prism>
            </div>
        </div>
    ) : null;
};

export default CohereOutput;
