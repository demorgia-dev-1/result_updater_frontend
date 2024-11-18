import { useState } from 'react';
import axios from 'axios';
import { BASE_URL } from './constants';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const UpdateCandidateResult = () => {
    const [batchId, setBatchId] = useState('');
    const [candidates, setCandidates] = useState([]);
    const [batch, setBatch] = useState({});
    const [percentages, setPercentages] = useState({});
    const [wpm, setWpm] = useState({});
    const [selectedCandidates, setSelectedCandidates] = useState({});
    const [selectAll, setSelectAll] = useState(false);

    const navigate = useNavigate();

    const handleBatchIdSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = sessionStorage.getItem('token');
            const response = await axios.get(`${BASE_URL}batches/${batchId}/candidates`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (response.status === 200) {
                setBatch(response.data.batch);
                setCandidates(response.data.candidates);
            } else {
                console.error('Failed to fetch candidates');
            }
        } catch (error) {
            console.error('Error fetching candidates:', error);
            toast.error(error.response?.data?.message || 'Something went wrong');
        }
    };

    const handlePercentageChange = (candidateId, value) => {
        setPercentages({
            ...percentages,
            [candidateId]: value,
        });
    };

    const handleWpmChange = (candidateId, value) => {
        setWpm({
            ...wpm,
            [candidateId]: value,
        });
    };

    const handleCheckboxChange = (candidateId) => {
        setSelectedCandidates({
            ...selectedCandidates,
            [candidateId]: !selectedCandidates[candidateId],
        });
    };

    const handleSelectAllChange = () => {
        const newSelectedCandidates = {};
        candidates.forEach(candidate => {
            newSelectedCandidates[candidate._id] = !selectAll;
        });
        setSelectedCandidates(newSelectedCandidates);
        setSelectAll(!selectAll);
    };

    const handleDateChange = (value) => {
        setBatch({
            ...batch,
            startDate: value
        });
    };

    const handleUpdateResults = async () => {
        const token = sessionStorage.getItem('token');
        const updateData = candidates
            .filter(candidate => selectedCandidates[candidate._id])
            .map(candidate => ({
                _id: candidate._id,
                percentage: percentages[candidate._id],
                wpm: wpm[candidate._id],
                startTime: batch.startDate,
            }));

        try {
            const response = await axios.post(`${BASE_URL}batches/${batchId}/theory`, { candidates: updateData }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (response.status === 200) {
                console.log('Results updated successfully');
                toast.success('Results updated successfully');
            } else {
                console.error('Failed to update results');
            }
        } catch (error) {
            console.error('Error updating results:', error);
            toast.error(error.response?.data?.message || 'Something went wrong');
        }
    };

    const handleLogout = () => {
        sessionStorage.removeItem('token');
        navigate('/login');
    };

    const formatDateToIST = (dateString) => {
        if (!dateString) {
            return '';
        }

        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            console.error('Invalid date string:', dateString);
            return '';
        }

        const offset = date.getTimezoneOffset();
        const localDate = new Date(date.getTime() - (offset * 60 * 1000));
        return localDate.toISOString().slice(0, 16);
    };
    console.log('date', formatDateToIST(batch?.startDate))

    return (
        <>
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
                <div className="bg-white p-8  shadow-md w-full max-w-6xl">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold">Update Candidate Results</h1>
                        <button onClick={handleLogout} className="bg-red-500 text-white py-1 px-4  hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500">
                            Logout
                        </button>
                    </div>
                    <form onSubmit={handleBatchIdSubmit} className="mb-6">
                        <div className="mb-4">
                            <label htmlFor="batchId" className="block text-gray-700 font-bold mb-2">Batch ID:</label>
                            <input
                                type="text"
                                id="batchId"
                                value={batchId}
                                onChange={(e) => setBatchId(e.target.value)}
                                placeholder='Enter Batch ID'
                                required
                                className="w-96 px-3 py-2 border border-gray-800  focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>


                        <button type="submit" className="bg-blue-500 text-white py-1 px-4  hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
                            Fetch Candidates
                        </button>
                    </form>
                    {candidates.length > 0 && (
                        <div>
                            <table className="min-w-full bg-white border border-gray-800 text-center">
                                <thead>
                                    <tr>
                                        <th className="py-2 border border-gray-800">
                                            <input
                                                type="checkbox"
                                                checked={selectAll}
                                                onChange={handleSelectAllChange}
                                            />
                                        </th>
                                        <th className="py-2 border border-gray-800">Enrollment No</th>
                                        <th className="py-2 border border-gray-800">Name</th>
                                        <th className="py-2 border border-gray-800">Update Percentage</th>
                                        <th className="py-2 border border-gray-800">Word Per Minute</th>
                                        <th className="py-2 border border-gray-800">Batch Start Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {candidates.map((candidate) => (
                                        <tr key={candidate._id}>
                                            <td className="border border-gray-800 px-4 py-2">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedCandidates[candidate._id] || false}
                                                    onChange={() => handleCheckboxChange(candidate._id)}
                                                />
                                            </td>
                                            <td className="border border-gray-800 px-4 py-2">{candidate.enrollmentNo}</td>
                                            <td className="border border-gray-800 px-4 py-2">{candidate.name}</td>
                                            <td className="border border-gray-800 px-4 py-2">
                                                <input
                                                    type="text"
                                                    value={percentages[candidate._id] || ''}
                                                    onChange={(e) => handlePercentageChange(candidate._id, e.target.value)}
                                                    placeholder='Percentage'
                                                    className="w-20 px-3 py-2 border border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </td>
                                            <td className="border border-gray-800 px-4 py-2">
                                                <input
                                                    type="text"
                                                    value={wpm[candidate._id] || ''}
                                                    onChange={(e) => handleWpmChange(candidate._id, e.target.value)}
                                                    placeholder='WPM'
                                                    className="w-20 px-3 py-2 border border-gray-800  focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </td>

                                            <td className="border border-gray-800 px-4 py-2">
                                                <input
                                                    type="datetime-local"
                                                    value={formatDateToIST(batch.startDate)}
                                                    onChange={(e) => handleDateChange(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-800  focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <button onClick={handleUpdateResults} className="bg-green-500 text-white py-1 px-4  hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 mt-4">
                                Update Results
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default UpdateCandidateResult;