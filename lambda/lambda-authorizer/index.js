export function handler (event, callback) {
    var token = event.authorizationToken;
    switch (token) {
      case "allow":
        callback(null, getPolicy("user", "Allow", event.methodArn));
        break;
      case "deny":
        callback(null, getPolicy("user", "Deny", event.methodArn));
        break;
      case "unauthorized":
        callback("Unauthorized");
        break;
      default:
        callback("Error: Token is not valid");
    }
  }

  export function getPolicy(principalId, effect, resource) {
    var response = {};
    
    response.principalId = principalId;
    if (effect && resource) {
        var policyDocument = {};
        policyDocument.Version = '2012-10-17'; 
        policyDocument.Statement = [];
        var statementOne = {};
        statementOne.Action = 'execute-api:Invoke'; 
        statementOne.Effect = effect;
        statementOne.Resource = resource;
        policyDocument.Statement[0] = statementOne;
        authResponse.policyDocument = policyDocument;
    }
    
    return response;
}