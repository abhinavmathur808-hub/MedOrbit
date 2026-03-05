
import { TypeAnimation } from 'react-type-animation';
import { useNavigate } from 'react-router-dom';

import cardiologistImg from '../assets/specialities/Cardiologist.png';
import neurologistImg from '../assets/specialities/Neurologist.png';
import psychiatristImg from '../assets/specialities/Psychiatrist.png';
import dermatologistImg from '../assets/specialities/Dermatologist.png';
import generalPhysicianImg from '../assets/specialities/General Physician.png';
import orthopedicImg from '../assets/specialities/Orthopedic.png';

const specialityData = [
    { speciality: 'Cardiologist', image: cardiologistImg },
    { speciality: 'Neurologist', image: neurologistImg },
    { speciality: 'Psychiatrist', image: psychiatristImg },
    { speciality: 'Dermatologist', image: dermatologistImg },
    { speciality: 'General Physician', image: generalPhysicianImg },
    { speciality: 'Orthopedic', image: orthopedicImg },
];

const SpecialityMenu = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center gap-4 py-24 px-6 md:px-12 max-w-6xl mx-auto w-full">
            <div className="flex flex-col items-center justify-center text-center w-full max-w-6xl mx-auto mb-10 gap-5">

                <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
                    Connect to{' '}
                    <TypeAnimation
                        sequence={[
                            'Cardiologists', 2000,
                            'Neurologists', 2000,
                            'Psychiatrists', 2000,
                            'Dermatologists', 2000,
                            'General Physicians', 2000,
                            'Orthopedics', 2000,
                        ]}
                        wrapper="span"
                        speed={50}
                        repeat={Infinity}
                        className="text-rose-500"
                    />
                </h2>

                <button
                    onClick={() => navigate('/doctors')}
                    className="bg-rose-600 text-white px-6 py-2 rounded-full hover:bg-rose-700 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 text-sm font-medium"
                >
                    View All Specialities
                </button>
            </div>

            <div className="flex sm:justify-center gap-10 pt-5 w-full overflow-x-auto pb-4 px-6">
                {specialityData.map((item, index) => (
                    <div
                        key={index}
                        onClick={() => navigate('/doctors', { state: { speciality: item.speciality } })}
                        className="flex flex-col items-center gap-3 cursor-pointer flex-shrink-0 group"
                    >
                        <div className="rounded-full p-1 border border-white/[0.06] group-hover:border-rose-500/40 transition-colors duration-300">
                            <img
                                src={item.image}
                                alt={item.speciality}
                                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover group-hover:-translate-y-1 transition-transform duration-300 ease-out"
                            />
                        </div>
                        <p className="text-sm font-medium text-center text-zinc-500 group-hover:text-white transition-colors duration-200">{item.speciality}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SpecialityMenu;
