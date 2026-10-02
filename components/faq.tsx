const questions = [
  { question: "What can I do with Operly?", answer: "Create projects, assign teammates, set deadlines, and check off tasks. Your overview brings progress and recent activity together." },
  { question: "Do I need an account to try it?", answer: "No. Choose Try a demo for a short guide through a project, its checklist, and your progress. Your existing workspace stays intact. You can skip the guide anytime or restart it from Help & getting started." },
  { question: "Where is my workspace data stored?", answer: "This version stores your changes in this browser using local storage. It does not sync between devices or people. You can download your data as JSON from Settings. Clearing browser data removes your saved workspace." },
  { question: "Will adding a teammate send an invitation?", answer: "Adding a teammate creates a local team record. Open Team to add people or change their roles, then assign them inside a project. No email is sent and no one else gains access to this browser’s workspace." },
  { question: "Will I be charged for choosing a plan?", answer: "No. The plans and prices illustrate the billing interface. Changing your demo plan does not create a subscription or collect a payment." },
];

export function FAQ() {
  return <div className="faq-list">{questions.map((item, index) => (
    <details className="faq-item" name="operly-faq" open={index === 0} key={item.question}>
      <summary className="faq-question"><h3>{item.question}<span className="faq-indicator" aria-hidden="true"/></h3></summary>
      <div className="faq-answer"><p>{item.answer}</p></div>
    </details>
  ))}</div>;
}
