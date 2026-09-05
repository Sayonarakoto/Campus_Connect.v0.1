import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const PromotionContext = createContext();

export function PromotionProvider({ children }) {

  const [promotions, setPromotions] = useState([]);

  const token = localStorage.getItem("token");

  const loadPromotions = async () => {

    try {

      if (!token) {
        setPromotions([]);
        return;
      }

      const res = await axios.get(
        "http://localhost:5000/api/promotions/visible",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const promotionList = res.data.promotions || [];

      setPromotions(promotionList);

      if (
        promotionList.length > 0 &&
        !sessionStorage.getItem("promotionViewsRecorded")
      ) {

        await axios.post(
          "http://localhost:5000/api/promotions/views",
          {
            promotionIds: promotionList.map(
              p => p._id
            )
          },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        sessionStorage.setItem(
          "promotionViewsRecorded",
          "true"
        );

      }

    } catch (err) {

      console.error(err);

    }

  };

  useEffect(() => {

    loadPromotions();

    const interval = setInterval(
      loadPromotions,
      30000
    );

    return () => clearInterval(interval);

  }, [token]);

  return (
    <PromotionContext.Provider
      value={{
        promotions,
        refreshPromotions: loadPromotions
      }}
    >
      {children}
    </PromotionContext.Provider>
  );

}

export function usePromotionContext() {
  return useContext(PromotionContext);
}