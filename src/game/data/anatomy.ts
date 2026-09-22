/**
 * Educational content — static fallback layer (spec §19/§20).
 * Qwen enhances these; it never replaces them as single point of failure.
 */
export interface AnatomyInfo {
  id: string;
  organ: string;
  title: string;
  subtitle: string;
  body: string;
  missionTip: string;
  funFact: string;
  keywords: string[];
}

export const ANATOMY: Record<string, AnatomyInfo> = {
  coronaryArtery: {
    id: "coronaryArtery",
    organ: "coronary artery",
    title: "CORONARY ARTERY",
    subtitle: "Blood supply route to the heart muscle.",
    body:
      "Coronary arteries wrap around the heart and deliver oxygen-rich blood to the cardiac muscle itself. The heart never rests, so it needs a constant supply. When one of these vessels narrows, the muscle downstream is the first to suffer.",
    missionTip: "A blockage here can restrict blood flow and damage heart tissue. Restore the flow.",
    funFact: "Coronary arteries are only about 3 to 4 mm wide — roughly the width of a spaghetti strand.",
    keywords: ["oxygen", "heart", "blood flow"],
  },
  redBloodCell: {
    id: "redBloodCell",
    organ: "red blood cell",
    title: "RED BLOOD CELL",
    subtitle: "Oxygen delivery unit of the bloodstream.",
    body:
      "Red blood cells are flexible discs packed with hemoglobin, an iron-rich protein that grabs oxygen in the lungs and releases it where the body needs it. Each one carries about 270 million hemoglobin molecules and bends easily to squeeze through the narrowest capillaries.",
    missionTip: "Notice how cells flow smoothly here. Turbulence upstream means something is blocking the channel.",
    funFact: "Your body makes roughly 2.4 million new red blood cells every second.",
    keywords: ["hemoglobin", "oxygen", "capillary"],
  },
  platelet: {
    id: "platelet",
    organ: "platelet",
    title: "PLATELET",
    subtitle: "First responder of the clotting cascade.",
    body:
      "Platelets are cell fragments that patrol the bloodstream. When a vessel wall is injured they stick to the damage, activate, and recruit more platelets to form a plug. This is essential for healing, but inside an artery narrowed by plaque, a clump can grow into a dangerous clot.",
    missionTip: "Platelet clusters cling to the plaque roughness. They are a sign the narrowing is worsening.",
    funFact: "Platelets are not cells. They are fragments shed by giant bone-marrow cells called megakaryocytes.",
    keywords: ["clot", "coagulation", "healing"],
  },
  plaque: {
    id: "plaque",
    organ: "cholesterol plaque",
    title: "ATHEROSCLEROTIC PLAQUE",
    subtitle: "Fatty buildup narrowing the vessel.",
    body:
      "Plaque is a mix of cholesterol, fats, calcium and cellular debris that accumulates inside artery walls over years. As it grows, the channel for blood narrows and the wall surface turns rough, encouraging clots to form right on top of the buildup.",
    missionTip: "The plaque is the source of the obstruction. Break down the clot attached to it.",
    funFact: "Atherosclerosis can begin in childhood and develop silently for decades before symptoms appear.",
    keywords: ["cholesterol", "artery", "blockage"],
  },
  thrombus: {
    id: "thrombus",
    organ: "blood clot",
    title: "THROMBUS",
    subtitle: "A clot lodged in the flow channel.",
    body:
      "A thrombus is a blood clot that forms inside a vessel. In a coronary artery already narrowed by plaque, a fresh thrombus can shut off blood flow completely. Heart muscle downstream starts losing oxygen within minutes, which is why fast response matters.",
    missionTip: "Charge the nano-tool and hold the treatment beam on the clot to dissolve it segment by segment.",
    funFact: "Dissolving a coronary clot quickly with treatment can mean the difference between minor and permanent heart damage.",
    keywords: ["clot", "thrombosis", "ischemia"],
  },
  vesselWall: {
    id: "vesselWall",
    organ: "artery wall",
    title: "ARTERY WALL",
    subtitle: "Three living layers in one tube.",
    body:
      "An artery has three layers: a smooth inner lining called the endothelium, a muscular middle layer that can constrict or widen the vessel, and an outer sheath of connective tissue. The endothelium is only one cell thick, yet it controls how easily blood flows and how likely clots are.",
    missionTip: "Avoid scraping the wall. Damaging the endothelium invites more clotting.",
    funFact: "Laid end to end, the blood vessels in one human body would stretch about 100,000 kilometers.",
    keywords: ["endothelium", "artery", "circulation"],
  },
  heartChamber: {
    id: "heartChamber",
    organ: "heart",
    title: "THE HEART",
    subtitle: "A muscular pump with four chambers.",
    body:
      "The heart beats around 100,000 times a day, pushing blood through two loops: one to the lungs for oxygen, one to the rest of the body. Each beat is triggered by its own electrical system, so the muscle keeps its rhythm without any conscious effort from you.",
    missionTip: "Patient status is rising. Keep the vessel clear and the rhythm will stabilize.",
    funFact: "The pressure the heart generates each beat could squirt blood roughly nine meters across a room.",
    keywords: ["cardiac", "pulse", "circulation"],
  },
  whiteBloodCell: {
    id: "whiteBloodCell",
    organ: "white blood cell",
    title: "WHITE BLOOD CELL",
    subtitle: "Sentinel of the immune system.",
    body:
      "White blood cells constantly sample their surroundings for signs of infection. When they find a virus, they can engulf infected debris, raise the alarm, and mark infected cells so other immune cells can finish the job.",
    missionTip: "Follow the white blood cell. It is reacting to something nearby.",
    funFact: "Some white blood cells can squeeze themselves through vessel walls to reach an infection site directly.",
    keywords: ["immune", "infection", "defense"],
  },
  virus: {
    id: "virus",
    organ: "virus",
    title: "VIRAL PARTICLE",
    subtitle: "A hijacker of cell machinery.",
    body:
      "A virus cannot reproduce on its own. It binds to a cell, injects its genetic instructions, and tricks the cell into building new virus copies. Detecting infected cells early limits how far the invasion spreads.",
    missionTip: "Do not touch free viral particles. Scan infected cells and assist the immune response.",
    funFact: "A single sneeze can launch tens of thousands of viral particles into the air.",
    keywords: ["infection", "virus", "cells"],
  },
  neuron: {
    id: "neuron",
    organ: "neuron",
    title: "NEURON",
    subtitle: "Signaling cell of the nervous system.",
    body:
      "Neurons communicate with electrical spikes that travel down an axon and jump across tiny gaps called synapses using chemical messengers. A single neuron can connect to thousands of others, forming the wiring of every thought and reflex.",
    missionTip: "Reconnect the broken pathway and watch the signal travel.",
    funFact: "Signals can race along some neurons at over 100 meters per second, faster than a race car.",
    keywords: ["synapse", "signal", "axon"],
  },
  alveolus: {
    id: "alveolus",
    organ: "alveoli",
    title: "ALVEOLUS",
    subtitle: "Where blood meets air.",
    body:
      "Alveoli are microscopic air sacs clustered at the end of the breathing tree. Oxygen slips through their paper-thin walls into the blood, while carbon dioxide makes the return trip out. Infections here swell the walls and thicken the barrier, making every breath less efficient.",
    missionTip: "Infected regions glow irregularly. Scan them and clear viral debris.",
    funFact: "If you unfolded every alveolus in your lungs flat, they would cover about half a tennis court.",
    keywords: ["gas exchange", "oxygen", "lungs"],
  },
  airwayWall: {
    id: "airwayWall",
    organ: "airway wall",
    title: "BRONCHIAL WALL",
    subtitle: "Smooth muscle, mucus and cilia in one tube.",
    body:
      "Airway walls are lined with cilia — tiny beating hairs that sweep mucus and trapped debris upward — wrapped in smooth muscle that can constrict the tube. During an infection the wall swells and mucus production surges, narrowing the channel the air (and you) travel through.",
    missionTip: "Inflamed walls are swollen and raw. The infection is deeper along this branch.",
    funFact: "The cilia in your airways beat about 10 times per second, moving mucus at roughly 1 cm per minute.",
    keywords: ["cilia", "mucus", "airway"],
  },
  macrophage: {
    id: "macrophage",
    organ: "macrophage",
    title: "MACROPHAGE",
    subtitle: "The immune system's big eater.",
    body:
      "Macrophages are large white blood cells that engulf and digest cellular debris, dead cells and pathogens — their name literally means 'big eater'. At an infection site they coordinate the response, calling other immune cells in and cleaning up the battlefield afterward.",
    missionTip: "Macrophages cluster where the threat is. They will finish what you neutralize.",
    funFact: "One macrophage can engulf more than 100 bacteria before it needs to be replaced.",
    keywords: ["immune", "phagocyte", "defense"],
  },
  infectedCell: {
    id: "infectedCell",
    organ: "infected cell",
    title: "INFECTED EPITHELIAL CELL",
    subtitle: "A hijacked cell displaying viral antigens.",
    body:
      "Once a virus takes over a cell, the cell is forced to build viral copies instead of doing its job. Fragments of viral protein appear on its surface — antigens — which flag the immune system to destroy it. Infected cells swell and lose their normal shape before bursting.",
    missionTip: "Scan the glowing cluster to measure the viral load before treating.",
    funFact: "A single infected cell can release thousands of new viral particles when it bursts.",
    keywords: ["antigen", "infection", "immune response"],
  },
  alveolarSac: {
    id: "alveolarSac",
    organ: "alveolar sac",
    title: "ALVEOLAR SAC",
    subtitle: "The cluster where gas exchange happens.",
    body:
      "Each alveolar sac is a bundle of alveoli wrapped in capillaries, forming the last stop of the breathing tree. Oxygen crosses into the blood here and carbon dioxide crosses back. When infection coats the sacs with fluid, that exchange slows — oxygen saturation falls.",
    missionTip: "Patient saturation is tied to these sacs. Clear the infection and watch them glow again.",
    funFact: "Your lungs contain around 480 million alveoli in total.",
    keywords: ["gas exchange", "capillary", "saturation"],
  },
  aneurysm: {
    id: "aneurysm",
    organ: "aneurysm",
    title: "ANEURYSM",
    subtitle: "A balloon forming in the vessel wall.",
    body:
      "An aneurysm is a weak spot in an artery wall that balloons outward under blood pressure. In the brain it often forms at branch points where flow stress is highest. If it grows and ruptures, the bleeding — a hemorrhagic stroke — can happen in seconds, which is why early detection matters.",
    missionTip: "Reinforce the wall before the bulge grows. Do not bump the fragile tissue.",
    funFact: "Brain aneurysms are often smaller than a pencil eraser — about 6 mm can already be high-risk.",
    keywords: ["stroke", "artery", "rupture"],
  },
  weakWall: {
    id: "weakWall",
    organ: "weakened wall",
    title: "DEGRADED WALL SEGMENT",
    subtitle: "Thinned tissue under flow stress.",
    body:
      "Where the vessel wall loses elasticity — from age, pressure or lipid deposits — it thins and stretches. Segments like these are the raw material of aneurysms. Reinforcing them restores the wall's strength and stops the ballooning before it starts.",
    missionTip: "Hold the treatment beam on each weak segment until the matrix locks in.",
    funFact: "Arterial walls are under a pressure wave about 100,000 times a day — every heartbeat.",
    keywords: ["vessel", "pressure", "reinforcement"],
  },
  axon: {
    id: "axon",
    organ: "axon fiber",
    title: "AXON",
    subtitle: "The neuron's transmission cable.",
    body:
      "An axon is the long fiber carrying electrical impulses away from a neuron's cell body. Many axons are wrapped in myelin, a fatty sheath that lets signals jump along at enormous speed. In this network, the bright strands around the vessel are axon bundles firing in sequence.",
    missionTip: "When the signal returns, you will see the axons light up in sequence.",
    funFact: "Some axons in your legs are over a meter long — a single cell, one meter end to end.",
    keywords: ["myelin", "signal", "neuron"],
  },
  synapse: {
    id: "synapse",
    organ: "synaptic terminal",
    title: "SYNAPSE",
    subtitle: "The gap where neurons talk.",
    body:
      "A synapse is the microscopic junction between two neurons. When an action potential arrives, vesicles release neurotransmitters across the gap, exciting or calming the next cell. Every thought, memory and movement is built from these chemical handshakes.",
    missionTip: "Perfusion restored means the terminals can fire again. Watch the signal ring.",
    funFact: "Your brain has roughly 100 trillion synapses — more stars than the Milky Way has.",
    keywords: ["neurotransmitter", "signal", "brain"],
  },
};

/** Occasional mid-flight micro-facts (spec §46) — verified, non-spammy. */
export const MICRO_FACTS: string[] = [
  "Your heart beats roughly 100,000 times a day.",
  "A single red blood cell completes a full circuit of your body in about 60 seconds.",
  "Capillaries are so narrow that red blood cells bend to squeeze through singly.",
  "Arteries carry blood away from the heart; veins carry it back.",
  "Blood makes up about 7 percent of your body weight.",
  "The human body contains roughly 30 trillion cells.",
];

/** Request payload the client sends to /api/explain */
export interface ExplainRequest {
  organ: string;
  event: string;
  difficulty?: "beginner" | "curious" | "advanced";
  context?: string;
}

/** Validated response shape from /api/explain (static fallback guaranteed). */
export interface ExplainResponse {
  title: string;
  explanation: string;
  funFact: string;
  missionTip: string;
  keywords: string[];
  viaAI: boolean;
}

export function staticExplain(organ: string): ExplainResponse {
  const key = Object.keys(ANATOMY).find(
    (k) => ANATOMY[k].organ.toLowerCase() === organ.toLowerCase() || k === organ
  );
  const info = key ? ANATOMY[key] : ANATOMY.coronaryArtery;
  return {
    title: info.title,
    explanation: info.body,
    funFact: info.funFact,
    missionTip: info.missionTip,
    keywords: info.keywords,
    viaAI: false,
  };
}
