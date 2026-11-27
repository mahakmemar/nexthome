"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { StepHeader } from "@/components/wizard/StepHeader";
import { INITIAL_WIZARD_DATA, STEPS, WizardData } from "@/lib/wizard";
import { CategoryStep } from "@/components/wizard/CategoryStep";
import { SubCategoryStep } from "@/components/wizard/SubCategoryStep";
import { TimeSlotsStep } from "@/components/wizard/TimeSlotsStep";
import { AddressStep } from "@/components/wizard/AddressStep";
import { LocationDetailsStep } from "@/components/wizard/LocationDetailsStep";
import { DetailsStep } from "@/components/wizard/DetailsStep";
import { ProhibitedStep } from "@/components/wizard/ProhibitedStep";
import { PriceStep } from "@/components/wizard/PriceStep";
import { PublishStep } from "@/components/wizard/PublishStep";

const TITLES: Record<(typeof STEPS)[number], string> = {
  category: "What do you need help with?",
  subCategory: "What do you need help with?",
  "time-slots": "Select time slot(s) for pick-up",
  address: "Address",
  "location-details": "Floor and door code",
  details: "Title & description",
  prohibited: "",
  price: "Price",
  publish: "Publish ad",
};

export default function PostWizardPage() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [data, setData] = useState<WizardData>(INITIAL_WIZARD_DATA);
  const [submitting, setSubmitting] = useState(false);

  const step = STEPS[stepIndex];

  function update(patch: Partial<WizardData>) {
    setData((prev) => ({ ...prev, ...patch }));
  }

  function goNext() {
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  }

  function goBack() {
    if (stepIndex === 0) {
      router.push("/");
      return;
    }
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  async function publish() {
    setSubmitting(true);
    try {
      const seed = encodeURIComponent(data.title || "task");
      const res = await fetch("/api/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          photos: [`https://picsum.photos/seed/${seed}/900/700`],
        }),
      });
      if (!res.ok) throw new Error("Failed to publish ad");
      const ad = await res.json();
      router.push(`/ads/${ad.id}`);
    } catch (e) {
      console.error(e);
      setSubmitting(false);
    }
  }

  return (
    <div className="pb-28">
      <StepHeader
        title={TITLES[step]}
        onBack={stepIndex > 0 ? goBack : undefined}
        onClose={() => router.push("/")}
      />

      {step === "category" && (
        <CategoryStep
          value={data.category}
          onSelect={(category) => {
            update({ category, subCategory: null });
            goNext();
          }}
        />
      )}

      {step === "subCategory" && data.category && (
        <SubCategoryStep
          category={data.category}
          value={data.subCategory}
          onSelect={(subCategory) => {
            update({ subCategory });
            goNext();
          }}
        />
      )}

      {step === "time-slots" && (
        <TimeSlotsStep
          value={data.timeSlots}
          onChange={(timeSlots) => update({ timeSlots })}
          onContinue={goNext}
        />
      )}

      {step === "address" && (
        <AddressStep
          address={data.address}
          latitude={data.latitude}
          longitude={data.longitude}
          onChange={update}
          onContinue={goNext}
        />
      )}

      {step === "location-details" && (
        <LocationDetailsStep
          floor={data.floor}
          doorCode={data.doorCode}
          fitsInElevator={data.fitsInElevator}
          canHelpCarry={data.canHelpCarry}
          placement={data.placement}
          onChange={update}
          onContinue={goNext}
        />
      )}

      {step === "details" && (
        <DetailsStep
          title={data.title}
          description={data.description}
          size={data.size}
          onChange={update}
          onContinue={goNext}
        />
      )}

      {step === "prohibited" && <ProhibitedStep onContinue={goNext} />}

      {step === "price" && (
        <PriceStep price={data.price} onChange={(price) => update({ price })} onContinue={goNext} />
      )}

      {step === "publish" && (
        <PublishStep data={data} submitting={submitting} onPublish={publish} />
      )}
    </div>
  );
}
