import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "./Gate.css";

function GatePassQR() {
  const { id } = useParams();
  const [qrImage, setQrImage] = useState("");

  const token = localStorage.getItem("token");

  const fetchQR = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/gatepass/qr/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setQrImage(response.data.qrImage);
    } catch (error) {
      console.error(error);
      alert(
        error.response?.data?.message ||
        "Failed to load QR code"
      );
    }
  };

  useEffect(() => {
    fetchQR();
  }, [id]);

  return (
    <div className="gate-container qr-container">
      <h2 className="gate-title">
        Approved Gate Pass
      </h2>

      {qrImage ? (
        <img
          src={qrImage}
          alt="Gate Pass QR Code"
          className="qr-image"
        />
      ) : (
        <div className="loading">
          Loading QR Code...
        </div>
      )}
    </div>
  );
}

export default GatePassQR;