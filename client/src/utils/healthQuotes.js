

const HEALTH_QUOTES = [
    "Walking for just 30 minutes a day can reduce the risk of heart disease by up to 35%.",
    "Laughing 100 times is equivalent to 15 minutes of exercise on a stationary bicycle.",
    "Your nose can remember 50,000 different scents and is your body's best air filter.",
    "Drinking water before meals can help you consume 75 fewer calories per meal.",
    "The human brain uses 20% of the body's total energy, despite being only 2% of its weight.",
    "Sleeping less than 7 hours a night can reduce your immune system effectiveness by 40%.",
    "Regular stretching can improve blood circulation and reduce muscle tension by up to 30%.",
    "Dark chocolate contains antioxidants that can help lower blood pressure naturally.",
    "Your body produces about 25 million new cells each second — that's 2 trillion per day.",
    "A 20-minute nap can boost alertness by 100% and improve performance by 34%.",
    "Sunlight exposure for 10–15 minutes a day helps your body produce essential Vitamin D.",
    "Chewing food slowly can reduce calorie intake by up to 12% and improve digestion.",
    "Stress can shrink your brain — meditation has been shown to reverse this effect.",
    "The average adult heart beats about 100,000 times every single day.",
    "Exercising regularly can increase your lifespan by up to 4.5 years on average.",
    "Blueberries are one of the most antioxidant-rich foods and support brain health.",
    "Sitting for more than 8 hours a day increases the risk of chronic disease by 20%.",
    "Human bones are ounce-for-ounce stronger than steel and constantly remodeling.",
    "Handwashing for 20 seconds can reduce respiratory illness risk by up to 21%.",
    "Listening to music can reduce anxiety by up to 65% and lower cortisol levels.",
    "Your gut contains over 100 trillion bacteria that impact mood, immunity, and digestion.",
    "Eating breakfast can improve concentration and memory by up to 20% during the day.",
    "Deep breathing exercises can lower blood pressure in as little as 5 minutes.",
    "Green tea contains L-theanine, which promotes calm focus without drowsiness.",
];

export const getRandomHealthQuote = () => {
    const index = Math.floor(Math.random() * HEALTH_QUOTES.length);
    return HEALTH_QUOTES[index];
};

export default HEALTH_QUOTES;
