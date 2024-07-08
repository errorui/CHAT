 function getSender(loggedUser:any,users:any){
    // return "A"
    if(users.length<=0){
        return;
    }
    return users[0]._id===loggedUser._id?users[1]:users[0]
}
 const isSameSenderMargin = (messages:any, m:any, i:any, userId:any) => {
  
  
    if (
      i < messages.length - 1 &&
      messages[i + 1].sender._id === m.sender._id &&
      messages[i].sender._id !== userId
    )
      return 33;
    else if (
      (i < messages.length - 1 &&
        messages[i + 1].sender._id !== m.sender._id &&
        messages[i].sender._id !== userId) ||
      (i === messages.length - 1 && messages[i].sender._id !== userId)
    )
      return 0;
    else return "auto";
  };
  
 const isSameSender = (messages:any, m:any, i:any, userId:any) => {
    return (
      i < messages.length - 1 &&
      (messages[i + 1].sender._id !== m.sender._id ||
        messages[i + 1].sender._id === undefined) &&
      messages[i].sender._id !== userId
    );
  };
  
  const isLastMessage = (messages:any, i:any, userId:any) => {
    return (
      i === messages.length - 1 &&
      messages[messages.length - 1].sender._id !== userId &&
      messages[messages.length - 1].sender._id
    );
  };

export{getSender,isSameSender,isLastMessage,isSameSenderMargin}