# Design Argument — Talk Again

## 1. The Person

This project is for my grandfather (외할아버지, my mother's father). He is 77. His day mostly unfolds at home — resting, walking in the neighborhood, watching TV while chatting with my grandmother. His body has grown frailer, so he no longer does the yard work he used to. From my mother I learned that, before the surgery, he was prickly and talkative, and he loved to sing more than almost anything. He cannot sing now. When I picture him, what comes to mind first is the opening in his throat — the scar from the surgery. Lately, watching him, I feel as though he has lost both his dreams and the small joys of everyday life. That is why I wanted to give him his old voice back. I still remember how, before the surgery, when we visited for holidays, he and my father would sit and talk for hours, asking each other questions.

## 2. The Problem

The surgery was about seven years ago. He was just reaching retirement, about to begin enjoying his life after work, when something went wrong with his tongue. He started going to the hospital, and by the time the cancer was found, it was already late. He had to have his tongue removed. I was young at the time and I did not see him often, so I do not remember much of that period directly — but I remember my mother crying a great deal.

After the surgery, my grandfather lost his speech. The way he used to talk with people was gone. He has to write things down on paper and show them. As he told me himself, this means conversations never really land, and because the other person has to wait while he writes, he ends up not having most conversations at all. My mother's deepest worry is this: she and my grandmother live alone together in the countryside, and if something happens to my grandmother in an emergency, my grandfather will not be able to call for help and explain their address or the situation.

## 3. What "Helped" Looks Like

Success means my grandfather is able to call for help directly if something happens to my grandmother, and that he can step forward into conversations with people again. I will know the tool has helped when I see him interrupting a conversation, or starting one of his own. I want him to talk more often and stay silent less. At the same time, this tool only helps him voice what he wants to say — it does not take responsibility for his decisions. What to say, and what to decide, remains his.

## 4. Why I Am the Right Person to Build This

I am his grandson. I have known him for a long time, and I am in a position to keep this work going past the class deadline through ongoing communication, feedback, and updates. On the technical side, I am studying UX design at SCAD and I have built and shipped products on several teams. In the previous two projects in this course, I learned how to direct AI clearly toward what I want. An outside designer, I think, would have missed my grandfather's personality and disposition, and the picture of who he was before the surgery.

## 5. Platform Decision

I first thought of this as an iPad-only app. But my grandfather does not currently own an iPad, and he is far away in Korea. So I am building it first as a website (a PWA), and when I am able to travel to Korea, I plan to set him up with an iPad and install it like an app. The interface is in Korean by default; English copy has been added as an option for the class presentation. The design uses large buttons, large type, high contrast, and icons together. The most common phrases speak instantly with a single tap. Once he has the iPad, I am considering how to use the Apple Pencil to preserve the writing-on-paper habit he already has. (Detailed reasoning in `Platform_Rationale.md`.)

## 6. Non-Negotiables

- **No voice cloning,** for two reasons:
    1. *Practical*: There are no clean recordings of his voice from before the surgery. The family searched, but none could be found.
    2. *Ethical*: A clone made from post-surgery samples would not be his voice — it would be a different identity standing in for his.
- **He must be able to use it comfortably alone.** The tool must function without an assistant beside him.
- **An emergency button is required.**
- **No dependence on anything else.** Not paper, not another person's comprehension, not an assistant. This one tool, on its own, must let him speak in his own voice.
