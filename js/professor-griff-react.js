class ProfessorGriffApp extends React.Component {
    constructor(props) {
        super(props);
        this.programSelectRef = React.createRef();
        this.state = {
            questions: [],
            loading: true,
            selectedQuestion: null,
            showModal: false, // Controls modal visibility
            allPrograms: [],
            programSearch: "",
            newQuestion: {
                programs: [],
                previousCourses: "",
                question: ""
            },
            submissionMessage: null
        };
    }

    componentDidMount() {
        this.fetchQuestions();
    }

    fetchQuestions = async () => {
        try {
            //const response = await fetch("http://127.0.0.1:5000/list_questions");
            const response = await fetch("https://bc567usptc.execute-api.us-east-1.amazonaws.com/dev/list_questions");
            const questions = await response.json();
            console.log("Fetched questions:", questions);
            this.setState({ questions, loading: false });
        } catch (error) {
            console.error("Error fetching questions:", error);
            this.setState({ loading: false });
        }
    };

    handleSelectQuestion = (question) => {
        console.log("Selected question:", question);
        this.setState({ selectedQuestion: question });
    };

    handleOpenModal = async () => {
        try {
            //const response = await fetch("http://127.0.0.1:5000/program_titles");
            const response = await fetch("https://bc567usptc.execute-api.us-east-1.amazonaws.com/dev/program_titles");
            const programTitles = await response.json();
            this.setState({
                showModal: true,
                submissionMessage: null,
                allPrograms: programTitles
            }, () => {
                if (this.programSelectRef.current) {
                    if (this.programChoicesInstance) {
                        this.programChoicesInstance.destroy();
                    }
                    this.programChoicesInstance = new Choices(this.programSelectRef.current, {
                        removeItemButton: true,
                        searchEnabled: true,
                        placeholder: true,
                        placeholderValue: 'Select your majors, minors, etc.'
                    });
                }
            });
        } catch (error) {
            console.error("Error loading program titles:", error);
            this.setState({
                showModal: true,
                submissionMessage: null,
                allPrograms: []
            });
        }
    };

    handleCloseModal = () => {
        if (this.programChoicesInstance) {
            this.programChoicesInstance.destroy();
            this.programChoicesInstance = null;
        }
        this.setState({
            showModal: false,
            programSearch: "",
            newQuestion: { programs: [], previousCourses: "", question: "" }
        });
    };

    handleInputChange = (event) => {
        const { name, value } = event.target;
        this.setState(prevState => ({
            newQuestion: { ...prevState.newQuestion, [name]: value }
        }));
    };

    handleSubmitQuestion = async (event) => {
        event.preventDefault();
        const { programs, previousCourses, question } = this.state.newQuestion;

        try {
            //const response = await fetch("http://127.0.0.1:5000/ask", {
            const response = await fetch("https://bc567usptc.execute-api.us-east-1.amazonaws.com/dev/ask", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    programs: programs,  // ✅ already an array
                    previous_courses: previousCourses,
                    question: question
                }),
            });

            const data = await response.json();
            this.setState({ submissionMessage: data.response });

            // Refresh the questions list after submission
            this.fetchQuestions();

        } catch (error) {
            console.error("Error submitting question:", error);
            this.setState({ submissionMessage: "An error occurred. Please try again." });
        }
    };

    formatTimestamp(timestamp) {
        return new Date(timestamp).toLocaleString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            timeZoneName: "short",
        });
    }

    renderCitations(aiResponse) {
        if (!aiResponse || aiResponse === "null") return null;
    
        try {
            const parsedResponse = JSON.parse(aiResponse);
            if (!parsedResponse || !parsedResponse.annotations) {
                return <p>No citations available.</p>;
            }
    
            const annotations = parsedResponse.annotations;
    
            if (annotations.length === 0) return <p>No citations available.</p>;
    
            return (
                <div>
                    <h4>References</h4>
                    {annotations.map((annotation, index) => {
                        const citation = annotation.file_citation;
                        const files = citation && Array.isArray(citation.file_data) ? citation.file_data : [];

                        // Use the first file to guide what type of citation this is
                        const file = files[0] || {};

                        const isProgramCitation = file.program_title && file.catalog_url;

                        return (
                            <div className="card mb-3" key={index}>
                                <div className="card-header">
                                    <strong>Source {index + 1}:</strong>{" "}
                                    {isProgramCitation
                                        ? file.program_title
                                        : file.course_number && file.title
                                            ? `${file.course_number} – ${file.title}`
                                            : citation && citation.file_name
                                                ? citation.file_name
                                                : "Unknown source"}
                                </div>
                                <div className="card-body">
                                    {isProgramCitation ? (
                                        <div>
                                            <a href={file.catalog_url} target="_blank" rel="noreferrer" className="btn btn-primary">
                                                View Catalog Requirements
                                            </a>
                                        </div>
                                    ) : (
                                        files.map((course, i) => (
                                            <div key={i}>
                                                <h5 className="card-title">{course.title || "Untitled Course"}</h5>
                                                <h6 className="card-subtitle mb-2 text-muted">
                                                    {course.course_number} – {course.term}
                                                </h6>
                                                <p className="card-text">
                                                    <strong>Faculty:</strong> {course.faculty && course.faculty.join(", ") || "TBA"}<br />
                                                    <strong>Times:</strong> {course.times && course.times.join(", ") || "TBA"}<br />
                                                    <strong>Location:</strong> {course.location && course.location.join(", ") || "TBA"}<br />
                                                    <strong>Credits:</strong> {typeof course.credit_hours !== "undefined" ? course.credit_hours : "?"}<br />
                                                    <strong>Prerequisites:</strong> {course.prereq || "None"}<br />
                                                    <strong>Description:</strong> {course.description ? course.description.trim() : "No description available."}
                                                </p>
                                                {course.course_search_url && (
                                                    <a href={course.course_search_url} target="_blank" rel="noreferrer" className="btn btn-primary">
                                                        Search in Course Catalog
                                                    </a>
                                                )}
                                                {citation && citation.quote && (
                                                    <p className="mt-2"><em>Quote:</em> "{citation.quote}"</p>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            );
        } catch (error) {
            console.error("Error parsing AI response:", error);
            return <p>Error loading citations.</p>;
        }
    }
    renderAIResponse(aiResponse) {
        if (!aiResponse || aiResponse === "null") return <p>No response yet.</p>;
    
        try {
            const parsedResponse = JSON.parse(aiResponse);
            if (!parsedResponse || !parsedResponse.text) {
                return <p>No valid response available.</p>;
            }
    
            let markdownText = parsedResponse.text;
            const annotations = parsedResponse.annotations || [];
    
            // Replace each marker with a citation number like [1]
            annotations.forEach((annotation, index) => {
                const citationText = annotation.text;
                const citationLabel = `<sup>[${index + 1}]</sup>`;
                markdownText = markdownText.split(citationText).join(citationLabel);
            });

    
            const html = marked.parse(markdownText); // Convert to HTML
    
            return <div dangerouslySetInnerHTML={{ __html: html }} />;
        } catch (error) {
            console.error("Error parsing AI response:", error);
            return <p>Error loading response.</p>;
        }
    }

    render() {
        return (
        <div className="container p-0">
            {/* Ask Question Button */}
            <div className="text-left mb-4">
                <button onClick={this.handleOpenModal} className="btn btn-primary">
                    Ask Your Question
                </button>
            </div>
            <div className="row">
                <div className="col-md-4">
                    <h3>Questions Asked By Users</h3>
                    {this.state.loading ? (
                        <div className="text-center my-4">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                    ) : (
                    <div className="list-group">
                        {this.state.questions.map((q) => (
                            <button
                                key={q.question_id}
                                type="button"
                                onClick={() => this.handleSelectQuestion(q)}
                                className={
                                    "list-group-item list-group-item-action" +
                                    (this.state.selectedQuestion && this.state.selectedQuestion.question_id === q.question_id ? " active" : "")
                                }
                            >
                                <div><strong>{q.question}</strong></div>
                    
                                {q.academic_programs && q.academic_programs.length > 0 && (
                                    <div className="text-muted small">{q.academic_programs.join(", ")}</div>
                                )}
                    
                                {q.previous_courses && q.previous_courses.trim() !== "" && (
                                    <div className="text-muted small">Previously taken: {q.previous_courses}</div>
                                )}
                    
                                <div className="text-muted small">{this.formatTimestamp(q.timestamp)}</div>
                            </button>
                        ))}
                    </div>
                    )}
                </div>

                {/* Main Section: Display Selected Question */}
                <div className="col-md-8">
                    {this.state.selectedQuestion ? (
                        <div className="card">
                            <div className="card-body">
                                <h3 className="card-title">Question Details</h3>
                                <p><strong>Question:</strong> {this.state.selectedQuestion.question}</p>
                                <p><strong>Asked On:</strong> {this.formatTimestamp(this.state.selectedQuestion.timestamp)}</p>
                                <p><strong>Academic Programs:</strong> {this.state.selectedQuestion.academic_programs.join(", ")}</p>
                                <p><strong>Previously Taken Courses:</strong> {this.state.selectedQuestion.previous_courses}</p>
                        
                                {/* Professor Griff's Response */}
                                <h4 className="mt-4">Professor Griff’s Response</h4>
                                <div className="d-flex align-items-start" style={{ gap: "15px", marginBottom: "20px" }}>
                                    <img src="images/professor_griff.png" alt="Professor Griff" style={{ width: "80px", height: "80px", borderRadius: "50%" }} />
                                    <div style={{ flex: 1 }}>
                                        {this.renderAIResponse(this.state.selectedQuestion.ai_response)}
                                    </div>
                                    
                                </div>
                                {this.state.selectedQuestion.endorsed_by ? (
                                    <div className="alert alert-success mt-4" role="alert">
                                        <strong>Professor Griff’s response has been endorsed by {this.state.selectedQuestion.endorsed_by}.</strong><br />
                                        Good boy! 🐶
                                    </div>
                                ) : (
                                    <div className="alert alert-warning mt-4" role="alert">
                                        <strong>Note:</strong> This response has <em>not yet been endorsed by a knowledgeable human</em>,
                                        so make sure to check with your advisor before acting on any of this information.
                                        Professor Griff is a good boy, but sometimes he makes mistakes! 🐾
                                    </div>
                                )}

                                {/* Advisor Responses */}
                                {Array.isArray(this.state.selectedQuestion.advisor_responses) &&
                                    this.state.selectedQuestion.advisor_responses.length > 0 && (
                                        <div className="mt-4">
                                            <h5>Advisor Feedback</h5>
                                            {this.state.selectedQuestion.advisor_responses.map((resp, index) => (
                                                <div className="alert alert-info d-flex align-items-start" key={index} style={{ gap: "15px" }}>
                                                    {resp.advisor_name === "Eric Manley" && (
                                                        <img
                                                            src="images/headshot.jpg"
                                                            alt="Eric Manley"
                                                            style={{ width: "60px", height: "60px", borderRadius: "50%", objectFit: "cover" }}
                                                        />
                                                    )}
                                                    <div>
                                                        <strong>{resp.advisor_name} says:</strong>
                                                        <div dangerouslySetInnerHTML={{ __html: marked.parse(resp.advisor_text || "") }} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                )}
                        
                                {this.renderCitations(this.state.selectedQuestion.ai_response)}
                            </div>
                        </div>
                    ) : (
                        <p>Select a question to see details.</p>
                    )}
                </div>

                {this.state.showModal && (
                <div className="modal show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
                    <div className="modal-content">
                        <div className="modal-header">
                        <h5 className="modal-title">Ask Professor Griff</h5>
                        <button type="button" className="btn-close" onClick={this.handleCloseModal} aria-label="Close"></button>
                        </div>
                        <div className="modal-body">
                        <form onSubmit={this.handleSubmitQuestion}>
                            <div className="mb-3">
                            <label className="form-label">Academic Programs</label>
                            <select
                                ref={this.programSelectRef}
                                multiple
                                className="form-select"
                                onChange={(e) => {
                                const selected = Array.from(e.target.selectedOptions, option => option.value);
                                this.setState(prev => ({
                                    newQuestion: { ...prev.newQuestion, programs: selected }
                                }));
                                }}
                            >
                                {this.state.allPrograms.map((title, index) => (
                                <option key={index} value={title}>{title}</option>
                                ))}
                            </select>
                            </div>

                            <div className="mb-3">
                            <label className="form-label">Courses you've already taken that are relevant to your question</label>
                            <input
                                type="text"
                                name="previousCourses"
                                className="form-control"
                                value={this.state.newQuestion.previousCourses}
                                onChange={this.handleInputChange}
                                placeholder="e.g., MATH 50, CS 65, etc."
                                required
                            />
                            </div>

                            <div className="mb-3">
                            <label className="form-label">Your Question</label>
                            <textarea
                                name="question"
                                className="form-control"
                                value={this.state.newQuestion.question}
                                onChange={this.handleInputChange}
                                required
                                rows={4}
                            />
                            </div>

                            <div className="d-flex justify-content-end">
                            <button type="submit" className="btn btn-primary me-2">Submit</button>
                            <button type="button" onClick={this.handleCloseModal} className="btn btn-secondary">Cancel</button>
                            </div>
                        </form>

                        {this.state.submissionMessage && (
                            <div className="alert alert-info mt-3">{this.state.submissionMessage}</div>
                        )}
                        </div>
                    </div>
                    </div>
                </div>
                )}
            </div>
        </div>
        );
    }
}

// 🚀 Mount the React app inside the "react-root" div
console.log("Mounting React component...");
const root = ReactDOM.createRoot(document.getElementById("react-root"));
root.render(<ProfessorGriffApp />);