import { useState } from 'react';
import axios from 'axios';
import { BASE_URL } from './constants';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { useDropzone } from 'react-dropzone';
import { MdOutlineFileDownload, MdOutlineUploadFile, MdOutlineLogout } from 'react-icons/md';


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
    const [selectedFile, setSelectedFile] = useState(null);
    const [practical, setPractical] = useState([]);
    const [viva, setViva] = useState([]);
    const [theory, setTheory] = useState([]);
    const [dates, setDates] = useState({});
    const [isLoading, setIsLoading] = useState(false);
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
                setTheory(response.data?.batch?.theoryQuestionBank);
            } else {
                console.error('Failed to fetch candidates');
            }
        } catch (error) {
            console.error('Error fetching candidates:', error);
            toast.error(error?.response?.data?.message || 'Something went wrong');
            setCandidates([]);
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

    const handleDateChange = (candidateId, value) => {
        setDates(prevDates => ({
            ...prevDates,
            [candidateId]: value
        }));
    };

    const handleUpdateResults = async () => {
        const token = sessionStorage.getItem('token');
        const updateData = candidates
            .filter(candidate => selectedCandidates[candidate._id])
            .map(candidate => ({
                _id: candidate._id,
                percentage: percentages[candidate._id],
                wpm: wpm[candidate._id],
                startTime: dates[candidate._id] || batch.startDate,
            }));

        if (updateData.length === 0) {
            toast.error('No candidates selected!');
            return;
        }
        setIsLoading(true);
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
        } finally {
            setIsLoading(false);
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
    const handleDownloadExcel = () => {
        const selectedCandidateIds = Object.keys(selectedCandidates).filter(id => selectedCandidates[id]);
        if (selectedCandidateIds.length === 0) {
            toast.error('No candidates selected!');
            return;
        }

        const workbook = XLSX.utils.book_new();
        const combinedData = [];

        candidates
            .filter(candidate => selectedCandidateIds.includes(candidate._id))
            .forEach(candidate => {
                if (selectedTab === 'practical') {
                    practicalQuestions?.forEach((question) => {
                        const row = {
                            'Candidate ID': candidate._id,
                            'Enrollment No': candidate.enrollmentNo,
                            'Name': candidate.name,
                            'Question Id': `${question._id}`,
                            'Max Marks': question.marks,
                            'Update Marks': ''
                        };
                        combinedData.push(row);
                    });
                } else if (selectedTab === 'viva') {
                    vivaQuestions?.forEach((question) => {
                        const row = {
                            'Candidate ID': candidate._id,
                            'Enrollment No': candidate.enrollmentNo,
                            'Name': candidate.name,
                            'Question Id': `${question._id}`,
                            'Max Marks': question.marks,
                            'Update Marks': ''
                        };
                        combinedData.push(row);
                    });
                }
            });

        const worksheet = XLSX.utils.json_to_sheet(combinedData);

        const colWidths = combinedData.reduce((acc, row) => {
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
                },
                fill: {
                    patternType: "solid",
                    fgColor: { rgb: "FFFF00" }
                },
                font: {
                    bold: true
                }
            };
        }

        XLSX.utils.book_append_sheet(workbook, worksheet, 'Candidates');
        XLSX.writeFile(workbook, `candidates_${selectedTab}.xlsx`);
    };
    const onDrop = (acceptedFiles) => {
        const file = acceptedFiles[0];
        setSelectedFile(file);

    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });


    const handleUpload = async () => {
        if (!selectedFile) {
            toast.error('No file selected!');
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                console.log('jsonData:', jsonData);

                // Group responses by candidate
                const groupedResponses = {};
                jsonData.forEach(row => {
                    const candidateId = row['Candidate ID'];
                    if (!groupedResponses[candidateId]) {
                        groupedResponses[candidateId] = [];
                    }
                    groupedResponses[candidateId].push({
                        question: row['Question Id'],
                        marksObtained: row['Update Marks']
                    });
                });

                const updateData = Object.keys(groupedResponses).map(candidateId => ({
                    _id: candidateId,
                    responses: groupedResponses[candidateId]
                }));

                if (updateData.length === 0) {
                    toast.error('No candidates selected!');
                    return;
                }

                console.log('updateData:', updateData);

                const token = sessionStorage.getItem('token');
                const url = selectedTab === 'practical'
                    ? `${BASE_URL}batches/${batchId}/practical`
                    : `${BASE_URL}batches/${batchId}/viva`;

                const response = await axios.post(url, { result: updateData }, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (response.status === 200) {
                    console.log('Results updated successfully');
                    toast.success('Results updated successfully');
                } else {
                    console.error('Failed to update results');
                    toast.error('Failed to update results');
                }
            } catch (error) {
                console.error('Error processing file:', error);
                toast.error(error.response?.data?.message || 'Something went wrong');
            }
        };

        reader.onerror = (error) => {
            console.error('Error reading file:', error);
            toast.error('Error reading file');
        };

        reader.readAsArrayBuffer(selectedFile);
    };

    return (
        <>
            <div className="w-full flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-200 to-gray-400">
                <span className="text-4xl font-semibold mb-3 font-mono">Welcome</span>
                <div className="bg-white p-8 shadow-md w-full max-w-6xl">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6 border border-gray-600 p-3 bg-gradient-to-b from-slate-200 to-slate-400 w-full">
                        <h1 className="text-3xl font-bold font-mono">Update Candidate Results</h1>
                        <button
                            onClick={handleLogout}
                            className="bg-gradient-to-t from-red-700 to-red-500 text-white border border-gray-600 font-medium overflow-hidden relative px-2 py-1.5 hover:brightness-110 group flex items-center font-mono gap-2"
                        >
                            <span><MdOutlineLogout className='text-xl' /></span>
                            <span >Logout</span>
                        </button>
                    </div>
                    <form onSubmit={handleBatchIdSubmit} className="mb-6">
                        <div className="mb-1">
                            <label htmlFor="batchId" className="block text-gray-700 font-bold mb-2 font-mono">
                                Batch ID:
                            </label>
                            <input
                                type="text"
                                id="batchId"
                                value={batchId}
                                onChange={(e) => setBatchId(e.target.value)}
                                placeholder="Enter Batch ID"
                                required
                                className="w-full md:w-96 px-3 py-2 border border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gradient-to-b from-slate-100 to-slate-300 font-mono"
                            />
                        </div>
                        <div className="flex flex-col md:flex-row justify-between">
                            <div className='mt-7'>
                                <div className="flex gap-1 md:mb-0">
                                    {batchId && (
                                        <>
                                            {theory !== null && (
                                                <button
                                                    onClick={() => setSelectedTab('theory')}
                                                    className={`py-1 px-4 ${selectedTab === 'theory' ? 'bg-blue-500 text-white border-x-2 border-gray-700' : 'bg-blue-100 text-gray-800'} focus:outline-none border border-gray-700 font-mono font-bold`}
                                                >
                                                    Update Theory
                                                </button>
                                            )}
                                            {practical !== null && (
                                                <button
                                                    onClick={() => setSelectedTab('practical')}
                                                    className={`py-1 px-4 ${selectedTab === 'practical' ? 'bg-blue-500 text-white' : 'bg-blue-100 text-gray-800'} focus:outline-none border border-gray-700 font-mono font-bold`}
                                                >
                                                    Update Practical
                                                </button>
                                            )}
                                            {viva !== null && (
                                                <button
                                                    onClick={() => setSelectedTab('viva')}
                                                    className={`py-1 px-4 ${selectedTab === 'viva' ? 'bg-blue-500 text-white border-x-2 border-gray-700' : 'bg-blue-100 text-gray-800'} focus:outline-none border border-gray-700 font-mono font-bold`}
                                                >
                                                    Update Viva
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            {(selectedTab === 'practical' || selectedTab === 'viva') && (<div className='flex justify-end gap-3'>
                                <div className='mt-7'>
                                    <button onClick={handleDownloadExcel} className="bg-green-500 text-white py-1 px-2 hover:bg-green-600 focus:outline-none focus:ring-2  focus:ring-green-500 border border-gray-700 font-bold font-mono flex items-center gap-2">
                                        <span ><MdOutlineFileDownload className='text-xl' /></span>
                                        <span>Download</span>
                                    </button>
                                </div>

                                <div
                                    {...getRootProps()}
                                    className={`w-full border-2 border-dashed  p-1 transition-all ease-in-out duration-300 ${isDragActive ? 'bg-blue-100 border-blue-500' : 'bg-gray-50 border-gray-300'} hover:bg-gray-100 hover:border-gray-400 cursor-pointer text-sm`}
                                >
                                    <input {...getInputProps()} />
                                    {isDragActive ? (
                                        <p className="text-blue-700 font-semibold text-center">Drop the files here ...</p>
                                    ) : (
                                        <p className="text-gray-700 text-center">
                                            Drag & drop a file here, or <span className="text-purple-600 ">click to select a file</span>
                                        </p>
                                    )}
                                    {selectedFile && (
                                        <div className="mt-1 text-center">
                                            <span className="font-semibold">Selected File: </span>
                                            <span className="text-gray-800">{selectedFile.name}</span>
                                        </div>
                                    )}
                                </div>

                                <div className=" mt-7">
                                    <button
                                        onClick={handleUpload}
                                        className="bg-purple-500 hover:bg-purple-600 text-white py-1 px-4 transition-all ease-in-out duration-300 shadow-lg flex items-center space-x-2 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-700"
                                    >
                                        <span ><MdOutlineUploadFile className='text-xl' /></span>
                                        <span>Upload</span>
                                    </button>
                                </div>

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
                                                <th className="py-2 border border-gray-800 font-mono font-bold">Enrollment No</th>
                                                <th className="py-2 border border-gray-800 font-mono font-bold">Name</th>
                                                <th className="py-2 border border-gray-800 font-mono font-bold">Update Percentage</th>
                                                <th className="py-2 border border-gray-800 font-mono font-bold">Word Per Minute</th>
                                                <th className="py-2 border border-gray-800 font-mono font-bold">Batch Start Date</th>
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
                                                <th className="py-2 border border-gray-800 font-mono font-bold">Enrollment No</th>
                                                <th className="py-2 border border-gray-800 font-mono font-bold">Name</th>
                                                <th className="py-2 border border-gray-800 font-mono font-bold">Batch Start Date</th>
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
                                                <th className="py-2 border border-gray-800 font-mono font-bold">Enrollment No</th>
                                                <th className="py-2 border border-gray-800 font-mono font-bold">Name</th>
                                                <th className="py-2 border border-gray-800 font-mono font-bold">Batch Start Date</th>
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
                                                    onChange={() => handleCheckboxChange(candidate._id)

                                                    }
                                                />
                                            </td>
                                            <td className="border border-gray-800 px-4 py-2 font-mono">{candidate.enrollmentNo}</td>
                                            <td className="border border-gray-800 px-4 py-2 font-mono">{candidate.name}</td>
                                            {selectedTab === 'theory' && (
                                                <>
                                                    <td className="border border-gray-800 px-4 py-2">
                                                        <input
                                                            type="text"
                                                            value={percentages[candidate._id] || ''}
                                                            onChange={(e) => handlePercentageChange(candidate._id, e.target.value)}
                                                            placeholder='Percentage'
                                                            className="w-20 px-3 py-2 border border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono bg-gradient-to-b from-slate-100 to-slate-300"
                                                        />
                                                    </td>
                                                    <td className="border border-gray-800 px-4 py-2">
                                                        <input
                                                            type="text"
                                                            value={wpm[candidate._id] || ''}
                                                            onChange={(e) => handleWpmChange(candidate._id, e.target.value)}
                                                            placeholder='WPM'
                                                            className="w-20 px-3 py-2 border border-gray-800  focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono bg-gradient-to-b from-slate-100 to-slate-300"
                                                        />
                                                    </td>
                                                    <td className="border border-gray-800 px-4 py-2">
                                                        <input
                                                            type="datetime-local"
                                                            value={dates[candidate._id] || formatDateToIST(batch.startDate)}
                                                            onChange={(e) => handleDateChange(candidate._id, e.target.value)}
                                                            className="w-full px-3 py-2 border border-gray-800  focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gradient-to-b from-slate-100 to-slate-300 font-mono"
                                                        />
                                                    </td>
                                                </>
                                            )}
                                            {selectedTab === 'practical' && (
                                                <>

                                                    <td className="border border-gray-800 px-4 py-2">
                                                        <input
                                                            type="datetime-local"
                                                            value={dates[candidate._id] || formatDateToIST(batch.startDate)}
                                                            onChange={(e) => handleDateChange(candidate._id, e.target.value)}
                                                            className="w-full px-3 py-2 border border-gray-800  focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gradient-to-b from-slate-100 to-slate-300 font-mono"
                                                        />
                                                    </td>
                                                </>
                                            )}
                                            {selectedTab === 'viva' && (
                                                <>

                                                    <td className="border border-gray-800 px-4 py-2">
                                                        <input
                                                            type="datetime-local"
                                                            value={dates[candidate._id] || formatDateToIST(batch.startDate)}
                                                            onChange={(e) => handleDateChange(candidate._id, e.target.value)}
                                                            className="w-full px-3 py-2 border border-gray-800  focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gradient-to-b from-slate-100 to-slate-300 font-mono"
                                                        />
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))}

                                </tbody>
                            </table>
                            {selectedTab === 'theory' && (
                                <button
                                    onClick={handleUpdateResults}
                                    className="bg-green-500 text-white py-1 px-4 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 mt-4 border border-gray-700 font-mono font-bold"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Updating...' : 'Update Results'}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default UpdateCandidateResult;