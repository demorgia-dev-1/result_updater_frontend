import { useState } from 'react';
import axios from 'axios';
import { BASE_URL } from './constants';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

const UpdateCandidateResult = () => {
    const [batchId, setBatchId] = useState('');
    const [candidates, setCandidates] = useState([]);
    const [batch, setBatch] = useState({});
    const [percentages, setPercentages] = useState({});
    const [wpm, setWpm] = useState({});
    const [selectedCandidates, setSelectedCandidates] = useState({});
    const [selectAll, setSelectAll] = useState(false);
    const [selectedTab, setSelectedTab] = useState('theory');
    const [practicalQuestions, setPracticalQuestions] = useState([]);
    const [vivaQuestions, setVivaQuestions] = useState([]);
    const [practical, setPractical] = useState([]);
    const [viva, setViva] = useState([]);

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
                setPracticalQuestions(response.data.practicalQuestions);
                setVivaQuestions(response.data.vivaQuestions);
                setPractical(response.data?.batch?.practicalQuestionBank);
                setViva(response.data?.batch?.vivaQuestionBank);
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


    const handleUpdatePracticalResults = async () => {
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
            const response = await axios.post(`${BASE_URL}batches/${batchId}/practical`, { candidates: updateData }, {
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

    const handleUpdateVivaResults = async () => {
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
            const response = await axios.post(`${BASE_URL}batches/${batchId}/viva`, { candidates: updateData }, {
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


    const handleDownloadExcel = () => {
        const selectedCandidateIds = Object.keys(selectedCandidates).filter(id => selectedCandidates[id]);

        const workbook = XLSX.utils.book_new();

        candidates
            .filter(candidate => selectedCandidateIds.includes(candidate._id))
            .forEach(candidate => {
                const candidateData = [];

                if (selectedTab === 'practical') {
                    practicalQuestions?.forEach((question, index) => {
                        const row = {
                            'Questions': `Q.${index + 1} : ${question.title}`,
                            'Update Marks': ''
                        };
                        candidateData.push(row);
                    });
                } else if (selectedTab === 'viva') {
                    vivaQuestions?.forEach((question, index) => {
                        const row = {
                            'Questions': `Q.${index + 1} (MM ${question.marks}): ${question.title}`,
                            'Update Marks': ''
                        };
                        candidateData.push(row);
                    });
                }

                const worksheet = XLSX.utils.json_to_sheet(candidateData);


                const colWidths = candidateData.reduce((acc, row) => {
                    Object.keys(row).forEach((key, i) => {
                        const value = row[key] ? row[key].toString() : '';
                        acc[i] = Math.max(acc[i] || 10, value.length + 2);
                    });
                    return acc;
                }, []);

                worksheet['!cols'] = colWidths.map(width => ({ wch: width }));


                worksheet['!rows'] = [{ hpx: 30 }];

                const range = XLSX.utils.decode_range(worksheet['!ref']);
                for (let C = range.s.c; C <= range.e.c; ++C) {
                    const address = XLSX.utils.encode_col(C) + "1";
                    if (!worksheet[address]) continue;
                    if (!worksheet[address].s) worksheet[address].s = {};
                    worksheet[address].s = {
                        alignment: {
                            wrapText: true,
                            vertical: 'center',
                            horizontal: 'center'
                        }
                    };
                }

                XLSX.utils.book_append_sheet(workbook, worksheet, candidate.enrollmentNo);
            });

        XLSX.writeFile(workbook, `candidates_${selectedTab}.xlsx`);
    };
    return (
        <>
            <div className="w-full flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-200 to-gray-400">
                <span className="text-4xl font-semibold mb-3 font-serif">Welcome</span>
                <div className="bg-white p-8 shadow-md w-full max-w-6xl">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6 border border-gray-600 p-3 bg-gradient-to-b from-slate-200 to-slate-400 w-full">
                        <h1 className="text-3xl font-bold font-serif">Update Candidate Results</h1>
                        <button
                            onClick={handleLogout}
                            className="bg-red-700 text-white border border-gray-600 font-medium overflow-hidden relative px-2 py-2 hover:brightness-110 group"
                        >
                            <span className="relative px-7 py-2 font-serif font-bold">Logout</span>
                        </button>
                    </div>
                    <form onSubmit={handleBatchIdSubmit} className="mb-6">
                        <div className="mb-4">
                            <label htmlFor="batchId" className="block text-gray-700 font-bold mb-2 font-serif">
                                Batch ID:
                            </label>
                            <input
                                type="text"
                                id="batchId"
                                value={batchId}
                                onChange={(e) => setBatchId(e.target.value)}
                                placeholder="Enter Batch ID"
                                required
                                className="w-full md:w-96 px-3 py-2 border border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex flex-col md:flex-row justify-between">
                            <div className="flex gap-1 mb-4 md:mb-0">
                                <button onClick={() => setSelectedTab('theory')} className={`py-1 px-4 ${selectedTab === 'theory' ? 'bg-blue-500 text-white border-x-2 border-gray-700' : 'bg-gray-200 text-gray-800'}  focus:outline-none  border border-gray-700 font-serif font-bold`}>
                                    Update Theory
                                </button>
                                <button onClick={() => setSelectedTab('practical')} className={`py-1 px-4 ${selectedTab === 'practical' ? 'bg-blue-500 text-white ' : 'bg-gray-200 text-gray-800'} focus:outline-none border border-gray-700 font-serif font-bold`}>
                                    Update Practical
                                </button>

                                <button onClick={() => setSelectedTab('viva')} className={`py-1 px-4 ${selectedTab === 'viva' ? 'bg-blue-500 text-white border-x-2 border-gray-700' : 'bg-gray-200 text-gray-800'}  focus:outline-none border border-gray-700 font-serif font-bold`}>
                                    Update Viva
                                </button>
                            </div>


                            {(selectedTab === 'practical' || selectedTab === 'viva') && (<div>
                                <button onClick={handleDownloadExcel} className="bg-green-500 text-white py-1 px-4 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 border border-gray-700 font-bold font-serif">
                                    Download Excel
                                </button>
                            </div>)}


                        </div>
                    </form>

                    {candidates.length > 0 && (
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white border border-gray-800 text-center">
                                <thead>
                                    <tr>
                                        {selectedTab === 'theory' && (
                                            <>  <th className="py-2 border border-gray-800">
                                                <input
                                                    type="checkbox"
                                                    checked={selectAll}
                                                    onChange={handleSelectAllChange}
                                                />
                                            </th>
                                                <th className="py-2 border border-gray-800 font-serif font-bold">Enrollment No</th>
                                                <th className="py-2 border border-gray-800 font-serif font-bold">Name</th>
                                                <th className="py-2 border border-gray-800 font-serif font-bold">Update Percentage</th>
                                                <th className="py-2 border border-gray-800 font-serif font-bold">Word Per Minute</th>
                                                <th className="py-2 border border-gray-800 font-serif font-bold">Batch Start Date</th>
                                            </>
                                        )}
                                        {selectedTab === 'practical' && (
                                            <>
                                                <th className="py-2 border border-gray-800">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectAll}
                                                        onChange={handleSelectAllChange}
                                                    />
                                                </th>
                                                <th className="py-2 border border-gray-800 font-serif font-bold">Enrollment No</th>
                                                <th className="py-2 border border-gray-800 font-serif font-bold">Name</th>
                                                <th className="py-2 border border-gray-800 font-serif font-bold">Batch Start Date</th>
                                            </>
                                        )}
                                        {selectedTab === 'viva' && (
                                            <>
                                                <th className="py-2 border border-gray-800">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectAll}
                                                        onChange={handleSelectAllChange}
                                                    />
                                                </th>
                                                <th className="py-2 border border-gray-800 font-serif font-bold">Enrollment No</th>
                                                <th className="py-2 border border-gray-800 font-serif font-bold">Name</th>
                                                <th className="py-2 border border-gray-800 font-serif font-bold">Batch Start Date</th>
                                            </>
                                        )}
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
                                            <td className="border border-gray-800 px-4 py-2 font-serif">{candidate.enrollmentNo}</td>
                                            <td className="border border-gray-800 px-4 py-2 font-serif">{candidate.name}</td>
                                            {selectedTab === 'theory' && (
                                                <>
                                                    <td className="border border-gray-800 px-4 py-2">
                                                        <input
                                                            type="text"
                                                            value={percentages[candidate._id] || ''}
                                                            onChange={(e) => handlePercentageChange(candidate._id, e.target.value)}
                                                            placeholder='Percentage'
                                                            className="w-20 px-3 py-2 border border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-serif"
                                                        />
                                                    </td>
                                                    <td className="border border-gray-800 px-4 py-2">
                                                        <input
                                                            type="text"
                                                            value={wpm[candidate._id] || ''}
                                                            onChange={(e) => handleWpmChange(candidate._id, e.target.value)}
                                                            placeholder='WPM'
                                                            className="w-20 px-3 py-2 border border-gray-800  focus:outline-none focus:ring-2 focus:ring-blue-500 font-serif"
                                                        />
                                                    </td>
                                                    <td className="border border-gray-800 px-4 py-2">
                                                        <input
                                                            type="datetime-local"
                                                            value={formatDateToIST(batch.startDate)}
                                                            onChange={(e) => handleDateChange(e.target.value)}
                                                            className="w-full px-3 py-2 border border-gray-800  focus:outline-none focus:ring-2 focus:ring-blue-500 "
                                                        />
                                                    </td>
                                                </>
                                            )}
                                            {selectedTab === 'practical' && (
                                                <>

                                                    <td className="border border-gray-800 px-4 py-2">
                                                        <input
                                                            type="datetime-local"
                                                            value={formatDateToIST(batch.startDate)}
                                                            onChange={(e) => handleDateChange(e.target.value)}
                                                            className="w-[60%] px-3 py-2 border border-gray-800  focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        />
                                                    </td>
                                                </>
                                            )}
                                            {selectedTab === 'viva' && (
                                                <>

                                                    <td className="border border-gray-800 px-4 py-2">
                                                        <input
                                                            type="datetime-local"
                                                            value={formatDateToIST(batch.startDate)}
                                                            onChange={(e) => handleDateChange(e.target.value)}
                                                            className="w-[60%] px-3 py-2 border border-gray-800  focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        />
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))}

                                </tbody>
                            </table>
                            <button onClick={handleUpdateResults} className="bg-green-500 text-white py-1 px-4  hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 mt-4 border border-gray-700 font-serif font-bold">
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