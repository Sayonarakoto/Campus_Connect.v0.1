
import usePromotion from "../pages/Hooks/usePromotions";

import FloatingPromotion from "./FloatingPromotion";
import FormTopPromotion from "./FormTopPromotion";
import SidePromotion from "./SidePromotion";
import DashboardPromotion from "./DashboardPromotion";

function PromotionEngine() {

  const promotions = usePromotion();

  return (
    <>
      {/* Floating Corner */}
      {promotions
        .filter((p) => p.placement === "FLOATING_CORNER")
        .map((promotion) => (
          <FloatingPromotion
            key={promotion._id}
            promotion={promotion}
          />
        ))}

      {/* Form Top */}
      {promotions
        .filter((p) => p.placement === "FORM_TOP")
        .map((promotion) => (
          <FormTopPromotion
            key={promotion._id}
            promotion={promotion}
          />
        ))}

      {/* Left Margin */}
      {promotions
        .filter((p) => p.placement === "LEFT_MARGIN")
        .map((promotion) => (
          <SidePromotion
            key={promotion._id}
            promotion={promotion}
            side="left"
          />
        ))}

      {/* Right Margin */}
      {promotions
        .filter((p) => p.placement === "RIGHT_MARGIN")
        .map((promotion) => (
          <SidePromotion
            key={promotion._id}
            promotion={promotion}
            side="right"
          />
        ))}

      {/* Dashboard Cards */}
      {promotions
        .filter((p) => p.placement === "DASHBOARD_CARD")
        .map((promotion) => (
          <DashboardPromotion
            key={promotion._id}
            promotion={promotion}
          />
        ))}
    </>
  );
}

export default PromotionEngine;