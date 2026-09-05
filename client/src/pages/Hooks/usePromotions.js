import { usePromotionContext } from "../context/PromotionContext";

export default function usePromotions(placement = null) {

  const { promotions } = usePromotionContext();

  if (!placement) {
    return promotions;
  }

  return promotions.filter(
    (promotion) => promotion.placement === placement
  );

}