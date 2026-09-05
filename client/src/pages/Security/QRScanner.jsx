import { useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import axios from "axios";

function QRScanner() {
  useEffect(() => {
    const scanner =
      new Html5QrcodeScanner(
        "reader",
        {
          fps: 10,
          qrbox: 250
        },
        false
      );

    scanner.render(
      async (decodedText) => {
        try {
          const token =
            localStorage.getItem(
              "token"
            );

          const response =
            await axios.post(
              "http://localhost:5000/api/gatepass/verify",
              {
                token: decodedText
              },
              {
                headers: {
                  Authorization:
                    `Bearer ${token}`
                }
              }
            );

          alert(
            `Verified: ${response.data.studentName}`
          );

        } catch (error) {
          alert(
            error.response?.data
              ?.message ||
              "Verification Failed"
          );
        }
      },
      (error) => {
        // ignore scan errors
      }
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, []);

  return (
    <div>
      <h2>Security Scanner</h2>

      <div
        id="reader"
        style={{
          width: "500px",
          margin: "auto"
        }}
      ></div>
    </div>
  );
}

export default QRScanner;