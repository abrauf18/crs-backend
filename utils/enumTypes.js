const RESOURCE_TYPES = {
    SLIDESHOW:"slideshow", 
    VIDEO:"video", 
    EXIT_TICKET_TEST: "exit-ticket-test", 
    WORKSHEET: "worksheet", 
    QUIZ: "quiz", 
    ASSIGNMENT: "assignment",
    LAB: 'lab',
    STATION: 'station',
    ACTIVITY: 'activity',
    GUIDED_NOTE: 'guided-note',
    FORMATIVE_ASSESSMENT: 'formative-assessment',
    SUMMARIZED_ASSESSMENT: 'summarize-assessment',
    DATA_TRACKER: 'data-tracker'
}

const RESOURCE_STATUS = { 
    SHOW: "show", 
    HIDE: "hide"
}

const CLASSROOM_STATUS = { 
    ACTIVE: "active", 
    INACTIVE: "inactive"
}

module.exports = {RESOURCE_TYPES, RESOURCE_STATUS, CLASSROOM_STATUS}