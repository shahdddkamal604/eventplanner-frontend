
import React, { useEffect, useState } from "react";
import { API_BASE } from "../api/apiConfig";

function HomePage({ userEmail, onLogout }) {
  const [organizedEvents, setOrganizedEvents] = useState([]);
  const [invitedEvents, setInvitedEvents] = useState([]);
  const [showCreate, setShowCreate] = useState(false);

  const [newEvent, setNewEvent] = useState({
    title: "",
    date: "",
    time: "",
    location: "",
    description: "",
  });

  const [attendeesByEvent, setAttendeesByEvent] = useState({});
  const [inviteEmailByEvent, setInviteEmailByEvent] = useState({});

  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [searchRole, setSearchRole] = useState("any");
  const [searchResults, setSearchResults] = useState([]);

  const isSearching = searchResults.length > 0;

 
  useEffect(() => {
    if (userEmail) {
      loadOrganized(userEmail);
      loadInvited(userEmail);
    }
  }, [userEmail]);

  const loadOrganized = async (email) => {
    const res = await fetch(`${API_BASE}/events/organized/${email}`);
    const data = await res.json();
    setOrganizedEvents(data);
  };

  const loadInvited = async (email) => {
    const res = await fetch(`${API_BASE}/events/invited/${email}`);
    const data = await res.json();
    setInvitedEvents(data);
  };

  const createEvent = async (e) => {
    e.preventDefault();

  if (!newEvent.date) {
    alert("Please choose a date");
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0); 

  const selectedDate = new Date(newEvent.date); 

  if (isNaN(selectedDate.getTime())) {
    alert("Please choose a valid date");
    return;
  }

  if (selectedDate < today) {
    alert("You cannot create an event in the past");
    return; 
  }
    const body = { ...newEvent, organizer_email: userEmail };

    const res = await fetch(`${API_BASE}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (res.ok) {
      await loadOrganized(userEmail);
      setShowCreate(false);
      setNewEvent({
        title: "",
        date: "",
        time: "",
        location: "",
        description: "",
      });
      alert(data.message || "Event created successfully");
    } else {
      alert(data.message || "Could not create event");
    }
  };

  const deleteEvent = async (eventId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this event?"
    );
    if (!confirmDelete) return;

    const res = await fetch(
      `${API_BASE}/events/${eventId}?email=${encodeURIComponent(userEmail)}`,
      { method: "DELETE" }
    );

    const data = await res.json();
    if (!res.ok) {
      alert(data.message || "Could not delete event");
    } else {
      await loadOrganized(userEmail);
      alert(data.message || "Event deleted");
    }
  };

  const inviteUser = async (eventId) => {
  let inviteEmail = inviteEmailByEvent[eventId]; 

  if (!inviteEmail) {
    alert("Please enter an email to invite");
    return;
  }

  inviteEmail = inviteEmail.trim();

  if (inviteEmail.toLowerCase() === userEmail.toLowerCase()) {
    alert("You cannot invite yourself to your own event");
    return;
  }

  const body = { event_id: eventId, email: inviteEmail };

  const res = await fetch(`${API_BASE}/events/invite`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    alert(data.message || "Could not send invitation");
  } else {
    alert(data.message || "Invitation sent");
    setInviteEmailByEvent((prev) => ({ ...prev, [eventId]: "" }));
  }
};


  const loadAttendees = async (eventId) => {
    const res = await fetch(`${API_BASE}/events/responses/${eventId}`);
    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Could not load attendees");
    } else {
      const list = data.responses || [];
      setAttendeesByEvent((prev) => ({ ...prev, [eventId]: list }));
    }
  };

  const toggleAttendees = async (eventId) => {
    if (attendeesByEvent[eventId]) {
      const copy = { ...attendeesByEvent };
      delete copy[eventId];
      setAttendeesByEvent(copy);
    } else {
      await loadAttendees(eventId);
    }
  };

  const respondToEvent = async (eventId, status) => {
    const body = {
      event_id: eventId,
      email: userEmail,
      status,
    };

    const res = await fetch(`${API_BASE}/events/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.message || "Could not save response");
    } else {
      await loadInvited(userEmail);
      alert(data.message || "Response saved");
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();

    const params = new URLSearchParams();

    if (searchKeyword.trim()) {
      params.append("keyword", searchKeyword.trim());
    }

    if (searchDate) {
      params.append("date", searchDate);
    }

    if (searchRole !== "any") {
      params.append("role", searchRole); 
    }

    if (userEmail) {
      params.append("user_email", userEmail);
    }

    if (![...params.keys()].length) {
      setSearchResults([]);
      return;
    }

    const res = await fetch(`${API_BASE}/events/search?${params.toString()}`);
    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Search failed");
    } else {
      setSearchResults(Array.isArray(data) ? data : data.events || []);
    }
  };

  const clearSearch = () => {
    setSearchKeyword("");
    setSearchDate("");
    setSearchRole("any");
    setSearchResults([]);
  };

  const getRoleForEvent = (ev) => {
    if (ev.user_role) return ev.user_role;
    if (ev.organizer_email === userEmail) return "Organizer";
    return "Attendee";
  };

  return (
    <div className="home">
      {/* NAVBAR */}
      <header className="navbar">
        <span className="logo">EventPlanner</span>

        {/* Search & Filters */}
        <form
          onSubmit={handleSearch}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            flex: 1,
            justifyContent: "center",
          }}
        >
          <input
            className="search"
            placeholder="Search by keyword..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            style={{ maxWidth: "260px" }}
          />

          <input
            type="date"
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
            style={{
              background: "#121212",
              border: "1px solid #333",
              borderRadius: "6px",
              padding: "0.3rem 0.5rem",
              color: "#fff",
              fontSize: "0.8rem",
            }}
          />

          <select
            value={searchRole}
            onChange={(e) => setSearchRole(e.target.value)}
            style={{
              background: "#121212",
              border: "1px solid #333",
              borderRadius: "6px",
              padding: "0.3rem 0.5rem",
              color: "#fff",
              fontSize: "0.8rem",
            }}
          >
            <option value="any">Any role</option>
            <option value="organizer">Organizer</option>
            <option value="attendee">Attendee</option>
          </select>

          <button
            type="submit"
            className="primary-btn"
            style={{
              width: "auto",
              padding: "0.4rem 0.8rem",
              fontSize: "0.8rem",
            }}
          >
            Search
          </button>

          {isSearching && (
            <button
              type="button"
              onClick={clearSearch}
              style={{
                marginLeft: "0.3rem",
                background: "transparent",
                border: "1px solid #555",
                borderRadius: "6px",
                padding: "0.3rem 0.6rem",
                color: "#ccc",
                fontSize: "0.75rem",
                cursor: "pointer",
              }}
            >
              Clear
            </button>
          )}
        </form>

        <div className="nav-actions">
          <button
            className="plus-btn"
            onClick={() => setShowCreate(!showCreate)}
          >
            +
          </button>
          <button
            className="primary-btn"
            style={{ marginLeft: "0.5rem", padding: "0.3rem 0.7rem" }}
            onClick={onLogout}
          >
            Logout
          </button>
        </div>
      </header>

      {/* CREATE EVENT FORM */}
      {showCreate && (
        <div className="create-box">
          <h3>Create Event</h3>

          <form onSubmit={createEvent}>
            <input
              placeholder="Title"
              value={newEvent.title}
              onChange={(e) =>
                setNewEvent({ ...newEvent, title: e.target.value })
              }
              required
            />

            <div className="row">
              <input
                type="date"
                value={newEvent.date}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, date: e.target.value })
                }
                required
              />
              <input
                type="time"
                value={newEvent.time}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, time: e.target.value })
                }
                required
              />
            </div>

            <input
              placeholder="Location"
              value={newEvent.location}
              onChange={(e) =>
                setNewEvent({ ...newEvent, location: e.target.value })
              }
            />

            <input
              placeholder="Description"
              value={newEvent.description}
              onChange={(e) =>
                setNewEvent({ ...newEvent, description: e.target.value })
              }
            />

            <button className="primary-btn">Create</button>
          </form>
        </div>
      )}

      <div className="events">
        {/* SEARCH RESULTS */}
        {isSearching && (
          <>
            <h2>Search Results</h2>
            {searchResults.map((ev) => (
              <div key={ev._id} className="event-card">
                <strong>{ev.title}</strong>
                <p className="meta">
                  {ev.date} • {ev.time} • {ev.location}
                </p>
                <p className="meta">Role: {getRoleForEvent(ev)}</p>
                <p className="desc">{ev.description}</p>
              </div>
            ))}
          </>
        )}

        {/* ORGANIZED + INVITED  */}
        {!isSearching && (
          <>
            <h2>Your Events</h2>

            {organizedEvents.map((ev) => (
              <div key={ev._id} className="event-card">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "0.5rem",
                  }}
                >
                  <div>
                    <strong>{ev.title}</strong>
                    <p className="meta">
                      {ev.date} • {ev.time} • {ev.location}
                    </p>
                    <p className="meta">Role: Organizer</p>
                  </div>
                  <button
                    style={{
                      background: "#ff4b4b",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      padding: "0.2rem 0.6rem",
                      height: "fit-content",
                      cursor: "pointer",
                      fontSize: "0.8rem",
                    }}
                    onClick={() => deleteEvent(ev._id)}
                  >
                    Delete
                  </button>
                </div>

                <p className="desc">{ev.description}</p>

                <div
                  style={{
                    marginTop: "0.5rem",
                    display: "flex",
                    gap: "0.4rem",
                    alignItems: "center",
                  }}
                >
                  <input
                    style={{
                      flex: 1,
                      padding: "0.4rem 0.6rem",
                      borderRadius: "6px",
                      border: "none",
                    }}
                    placeholder="Invite by email..."
                    value={inviteEmailByEvent[ev._id] || ""}
                    onChange={(e) =>
                      setInviteEmailByEvent((prev) => ({
                        ...prev,
                        [ev._id]: e.target.value,
                      }))
                    }
                  />
                  <button
                    className="primary-btn"
                    style={{ padding: "0.4rem 0.8rem", width: "auto" }}
                    onClick={() => inviteUser(ev._id)}
                  >
                    Invite
                  </button>
                </div>

                <div style={{ marginTop: "0.5rem" }}>
                  <button
                    style={{
                      background: "#222",
                      color: "#fff",
                      borderRadius: "6px",
                      border: "1px solid #444",
                      padding: "0.3rem 0.7rem",
                      fontSize: "0.8rem",
                      cursor: "pointer",
                    }}
                    onClick={() => toggleAttendees(ev._id)}
                  >
                    {attendeesByEvent[ev._id]
                      ? "Hide attendees"
                      : "View attendees"}
                  </button>

                  {attendeesByEvent[ev._id] && (
                    <div style={{ marginTop: "0.4rem" }}>
                      <p className="meta">
                        Total attendees: {attendeesByEvent[ev._id].length}
                      </p>
                      {attendeesByEvent[ev._id].length === 0 ? (
                        <p className="meta">No attendees yet.</p>
                      ) : (
                        <ul style={{ margin: 0, paddingLeft: "1rem" }}>
                          {attendeesByEvent[ev._id].map((att, idx) => (
                            <li key={att.email || idx} className="meta">
                              {att.email} — {att.status}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {organizedEvents.length === 0 && (
              <p className="empty">No events yet. Click + to create one.</p>
            )}

            <h2 style={{ marginTop: "2rem" }}>Invited Events</h2>

            {invitedEvents.map((ev) => (
              <div key={ev._id} className="event-card">
                <strong>{ev.title}</strong>
                <p className="meta">
                  {ev.date} • {ev.time} • {ev.location}
                </p>
                <p className="meta">Organizer: {ev.organizer_email}</p>
                <p className="meta">Role: Attendee</p>
                <p className="desc">{ev.description}</p>

                <div
                  style={{
                    marginTop: "0.5rem",
                    display: "flex",
                    gap: "0.5rem",
                  }}
                >
                  <button
                    className="primary-btn"
                    style={{ flex: 1, padding: "0.4rem 0.5rem" }}
                    onClick={() => respondToEvent(ev._id, "Going")}
                  >
                    Going
                  </button>
                  <button
                    className="primary-btn"
                    style={{ flex: 1, padding: "0.4rem 0.5rem", opacity: 0.8 }}
                    onClick={() => respondToEvent(ev._id, "Maybe")}
                  >
                    Maybe
                  </button>
                  <button
                    className="primary-btn"
                    style={{
                      flex: 1,
                      padding: "0.4rem 0.5rem",
                      background: "#333",
                      color: "#fff",
                    }}
                    onClick={() => respondToEvent(ev._id, "Not Going")}
                  >
                    Not Going
                  </button>
                </div>
              </div>
            ))}

            {invitedEvents.length === 0 && (
              <p className="empty">No invitations yet.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default HomePage;
