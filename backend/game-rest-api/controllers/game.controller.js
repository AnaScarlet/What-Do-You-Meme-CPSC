const GameModel = require('../models/game.model');
const fetch = require('node-fetch');

exports.createRoom = async (req, res) => {

    if (!req.body) {
        return res.status(400).json({
            message: "Request body cannot be empty!"
        });
    }

    if (!req.body.czarId) {
        return res.status(400).json({
            message: "czarId body JSON element cannot be empty!"
        });
    }

    if (!req.body.czarUsername) {
        return res.status(400).json({
            message: "czarUsername body JSON element cannot be empty!"
        });
    }

    const code = generateCode(); // generate 6-letter code

    const img = await fetchImageUrl();
    if (img == null) {
        return res.status(500).json({
            message: "Some error occurred while fetching the new meme image url."
        });
    }
    if (!img.includes("http")) {
        if (img.includes("Some error")) {
            return res.status(500).json({
                message: img
            });
        }
        return res.status(400).json({
            message: img
        });
    }

    const users = [{
        _id: req.body.czarId,
        username: req.body.czarUsername,
        score: 0,
        cards: []
    }];

    const game = new GameModel({
        title: "What Do You Meme CPSC",
        czarUserId: req.body.czarId,
        code: code,
        imageUrl: img,
        selectedCaptions: [],
        users: users,
        roomCards: captions
    });

    game.save()
    .then( data => res.json(data))
    .catch( err => {
        console.log(err);
        res.status(500).json({
            message: err.message || "Some error occurred while creating the Lobby."
        });
    });

}

exports.getAllRooms = (req, res) => {
    GameModel.find()
    .then(rooms => {
        res.json(rooms);
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({
            message: "Some error occurred while retreiving game data."
        });
    });
}

exports.getRoom = (req, res) => {
    if (!req.params.roomId) {
        return res.status(400).json({
            message: "roomId url param cannot be empty!"
        });
    }

    GameModel.findById(req.params.roomId)
    .then(room => {
        if (!room) {
            return res.status(404).json({
                message: "Room with id " + req.params.roomId + " not found."
            });
        }
        return res.json(room);
    })
    .catch(err => {
        if (err.kind === 'ObjectId') {
            return res.status(404).json({
                message: "Room with id " + req.params.roomId + " not found."
            });
        }
        console.log(err);
        return res.status(500).json({
            message: "Error retrieving room with id " + req.params.roomId + "."
        });
    });
}

exports.addUserToRoom = (req, res) => {
    if (!req.params.roomId) {
        return res.status(400).json({
            message: "roomId url param cannot be empty!"
        });
    }

    if (!req.body.userId) {
        return res.status(400).json({
            message: "userId body JSON element cannot be empty!"
        });
    }

    if (!req.body.username) {
        return res.status(400).json({
            message: "username body JSON element cannot be empty!"
        });
    }

    GameModel.findOne({'_id': req.params.roomId}, (err, result) => {
        if (err) {
            return res.status(400).json({
                message: err.message
            });
        }
        var cards =  getFiveRandomCaptions(result.roomCards.toObject());

        GameModel.updateOne({'_id': req.params.roomId}, {$pull: {roomCards: {$in: cards}}}, (err, result) => {
            if (err) {
                console.log(err);
                return res.status(400).json({
                    message: err.message
                });
            }

            GameModel.findOneAndUpdate({'_id': req.params.roomId}, { $push: { 
                users: 
                    {
                        _id: req.body.userId,
                        username: req.body.username,
                        score: 0,
                        cards: cards
                    }
                }
            }, {new: true})
            .then(room => {
                if (!room) {
                    return res.status(400).json({
                        message: "Unable to find the given room."
                    });
                }
                return res.json(room);
            })
            .catch(err => {
                if (err) {
                    return res.status(400).json({
                        message: err.message
                    });
                }
                else {
                    return res.status(500).json({
                        message: "Some error happened while adding the user to the room."
                    });
                }
            });
        });
        
    });
       
}

exports.rotateCzarUser = (req, res) => {
    if (!req.params.roomId) {
        return res.status(400).json({
            message: "roomId url param cannot be empty!"
        });
    }

    GameModel.findById(req.params.roomId)
    .then(room => {
        let currentCzarId = room.czarUserId;
        let users = room.users;
        for (let i=0; i<users.length; i++) {
            if (room.users[i]._id === currentCzarId) {
                let newCzarUserId;
                if (i+1 < users.length) {
                    newCzarUserId = users[i+1]._id;
                }
                else {
                    newCzarUserId = users[0]._id;
                }

                GameModel.findOneAndUpdate({'_id': req.params.roomId}, {$set: {'czarUserId': newCzarUserId}}, {new: true})
                .then(room => {
                    if (!room) {
                        return res.status(400).json({
                            message: "Unable to find the given room while updating the czarUserId element."
                        });
                    }
                    return res.json(room);
                })
                .catch(err => {
                    if (err) {
                        return res.status(400).json({
                            message: err.message
                        });
                    }
                    else {
                        return res.status(500).json({
                            message: "Some error occurred while updating the czarUserId of the room."
                        });
                    }
                });
                break;
            }
        }
    })
    .catch(err => {
        if (err) {
            return res.status(400).json({
                message: err.message
            });
        }
        else {
            return res.status(500).json({
                message: "Some error occurred while searching for the room."
            });
        }
    });
}

exports.updateImage = async (req, res) => {
    if (!req.params.roomId) {
        return res.status(400).json({
            message: "roomId url param cannot be empty!"
        });
    }
    
    const img = await fetchImageUrl();
    if (img == null) {
        return res.status(500).json({
            message: "Some error occurred while fetching the new meme image url."
        });
    }
    if (!img.includes("http")) {
        if (img.includes("Some error")) {
            return res.status(500).json({
                message: img
            });
        }
        return res.status(400).json({
            message: img
        });
    }
    
    GameModel.findOneAndUpdate({'_id': req.params.roomId}, {$set: {imageUrl: img}}, {new: true})
    .then(room => {
        if (!room) {
            return res.status(400).json({
                message: "Unable to find the given room."
            });
        }
        return res.json(room);
    })
    .catch(err => {
        if (err) {
            return res.status(400).json({
                message: err.message
            });
        }
        else {
            return res.status(500).json({
                message: "Some error occurred while updating the meme image url of the room."
            });
        }
    });

}

exports.addSelectedCaptionToRoom = (req, res) => {
    if (!req.params.roomId) {
        return res.status(400).json({
            message: "roomId url param cannot be empty!"
        });
    }

    if (!req.body.userId) {
        return res.status(400).json({
            message: "userId body JSON element cannot be empty!"
        });
    }

    if (!req.body.selectedCaption) {
        return res.status(400).json({
            message: "selectedCaption body JSON element cannot be empty!"
        });
    }

    GameModel.find({'_id': req.params.roomId, "users._id": req.body.userId, 'users.cards': req.body.selectedCaption}, (err, result) => {
        if (!result.length) {
            return res.status(400).json({
                message: "Unable to find the given caption in the user's deck of cards."
            });
        }
        else if (err) {
            return res.status(400).json({
                message: err.message
            });
        }

        GameModel.updateOne({'_id': req.params.roomId}, { $push: {
            selectedCaptions: {
                caption: req.body.selectedCaption,
                ownerFirebaseId: req.body.userId
            }
        }})
        .then(() => {
            GameModel.findOneAndUpdate({'_id': req.params.roomId, "users._id": req.body.userId}, {$pull: {'users.$.cards': req.body.selectedCaption}}, {new: true})
            .then(room => {
                if (!room) {
                    return res.status(400).json({
                        message: "Unable to find the given room and user id combination."
                    });
                }
                return res.json(room);
            })
            .catch(err => {
                if (err) {
                    return res.status(400).json({
                        message: err.message
                    });
                }
                else {
                    return res.status(500).json({
                        message: "Some error occurred while deleting the selected caption card from the user's cards."
                    });
                }
            });
            
        })
        .catch(err => {
            if (err) {
                return res.status(400).json({
                    message: err.message
                });
            }
            else {
                return res.status(500).json({
                    message: "Some error occurred while adding the selected caption card to the room."
                });
            }
        });
    });
}

exports.clearSelectedCaptionsInRoom = (req, res) => {
    if (!req.params.roomId) {
        return res.status(400).json({
            message: "roomId url param cannot be empty!"
        });
    }
    
    GameModel.findOneAndUpdate({'_id': req.params.roomId}, {$set: {'selectedCaptions': []}}, {new: true})
    .then(room => {
        if (!room) {
            return res.status(400).json({
                message: "Unable to find the given room."
            });
        }
        return res.json(room);
    })
    .catch(err => {
        if (err) {
            return res.status(400).json({
                message: err.message
            });
        }
        else {
            return res.status(500).json({
                message: "Some error occurred while clearing selected caption cards in the room."
            });
        }
    });
}

exports.addCaptionCardToUser = (req, res) => {
    if (!req.params.roomId) {
        return res.status(400).json({
            message: "roomId url param cannot be empty!"
        });
    }

    if (!req.params.userId) {
        return res.status(400).json({
            message: "userId url param cannot be empty!"
        });
    }


    GameModel.findOne({'_id': req.params.roomId}, (err, result) => {
        if (err) {
            return res.status(400).json({
                message: err.message
            });
        }
        var card =  getRandomCaption(result.roomCards.toObject());

        GameModel.updateOne({'_id': req.params.roomId}, {$pull: {roomCards: card}}, (err, result) => {
            if (err) {
                console.log(err);
                return res.status(400).json({
                    message: err.message
                });
            }

            GameModel.findOneAndUpdate({'_id': req.params.roomId, 'users._id': req.params.userId}, {$push: {'users.$.cards': card}}, {new: true}, (err, result) => {
                if (err) {
                    return res.status(400).json({
                        message: err.message
                    });
                }
                if (!result) {
                    return res.status(400).json({
                        message: "Unable to find the given user id and room combination."
                    });
                }
                return res.json(result);
            });
        });
    });
}

exports.addFiveCaptionCardsToUser = (req, res) => {
    if (!req.params.roomId) {
        return res.status(400).json({
            message: "roomId url param cannot be empty!"
        });
    }

    if (!req.params.userId) {
        return res.status(400).json({
            message: "userId url param cannot be empty!"
        });
    }


    GameModel.findOne({'_id': req.params.roomId}, (err, result) => {
        if (err) {
            return res.status(400).json({
                message: err.message
            });
        }
        var cards =  getFiveRandomCaptions(result.roomCards.toObject());

        GameModel.updateOne({'_id': req.params.roomId}, {$pull: {roomCards: {$in: cards}}}, (err, result) => {
            if (err) {
                console.log(err);
                return res.status(400).json({
                    message: err.message
                });
            }

            GameModel.findOneAndUpdate({'_id': req.params.roomId, 'users._id': req.params.userId}, {$set: {'users.$.cards': cards}}, {new: true}, (err, result) => {
                if (err) {
                    console.log(err);
                    return res.status(400).json({
                        message: err.message
                    });
                }
                if (!result) {
                    return res.status(400).json({
                        message: "Unable to find the given user id and room combination."
                    });
                }
                return res.json(result);
            });
        });
    });
}

exports.incrementScoreOnUser = (req, res) => {
    if (!req.params.roomId) {
        return res.status(400).json({
            message: "roomId url param cannot be empty!"
        });
    }

    if (!req.params.userId) {
        return res.status(400).json({
            message: "userId url param cannot be empty!"
        });
    }

    GameModel.findOneAndUpdate({'_id': req.params.roomId, 'users._id': req.params.userId}, {$inc: {"users.$.score": 1}}, {new: true})
    .then(room => {
        if (!room) {
            return res.status(400).json({
                message: "Unable to find the given room and user id combination."
            });
        }
        return res.json(room);
    })
    .catch(err => {
        if (err) {
            return res.status(400).json({
                message: err.message
            });
        }
        else {
            return res.status(500).json({
                message: "Some error occurred while incrementing user's score in the room."
            });
        }
    });
}

exports.deleteUserFromRoom = (req, res) => {
    if (!req.params.roomId) {
        return res.status(400).json({
            message: "roomId url param cannot be empty!"
        });
    }

    if (!req.params.userId) {
        return res.status(400).json({
            message: "userId url param cannot be empty!"
        });
    }

    GameModel.findOne({'_id': req.params.roomId, 'users._id': req.params.userId})
    .then(room => {
        if (!room) {
            return res.status(400).json({
                message: "Unable to find the given room and user id combination."
            });
        }
        if (room.czarUserId === req.params.userId) {
            return res.status(400).json({
                message: "Cannot remove the Czar user from an ongoing game."
            });
        }

        GameModel.findOneAndUpdate({'_id': req.params.roomId}, {$pull: {
            'users': {'_id': req.params.userId}}
        }, {new: true})
        .then(room => {
            if (!room) {
                return res.status(400).json({
                    message: "Unable to find the given room and user id combination."
                });
            }
            return res.json(room);
        })
        .catch(err => {
            if (err) {
                return res.status(400).json({
                    message: err.message
                });
            }
            else {
                return res.status(500).json({
                    message: "Some error occurred while deleting the user from the room."
                });
            }
        });
    })
    .catch(err => {
        if (err) {
            return res.status(400).json({
                message: err.message
            });
        }
        else {
            return res.status(500).json({
                message: "Some error occurred while looking for the given room and user combination."
            });
        }
    });

}

exports.deleteRoom = (req, res) => {
    if (!req.params.roomId) {
        return res.status(400).json({
            message: "roomId url param cannot be empty!"
        });
    }

    GameModel.findOneAndDelete({'_id': req.params.roomId})
    .then(room => {
        if (!room) {
            return res.status(400).json({
                message: "Unable to find the given room."
            });
        }
        return res.json(room);
    })
    .catch(err => {
        if (err) {
            return res.status(400).json({
                message: err.message
            });
        }
        else {
            return res.status(500).json({
                message: "Some error occurred while deleting the room."
            });
        }
    });
}

function generateCode() {
    const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
    const capitalLetters = letters.map(ltr => ltr.toUpperCase());
    let code = "";
    for (i=0; i<6; i++) {
        let indx = Math.floor(Math.random() * 100 % (letters.length-1));
        if (i % 2 == 0) {
            code += letters[indx];
        }
        else {
            code += capitalLetters[indx];
        }
    }
    return code;
}

async function fetchImageUrl() {
    return await fetch('https://api.imgflip.com/get_memes', {
        method: 'get',
        headers: { 'Accept': 'application/json' },
    })
    .then(async res => {
        if (!res) {
            return "Unable to fetch meme image url."
        }
        let parsedRes = await res.text();
        let memeData = JSON.parse(parsedRes).data.memes;
        var num = Math.floor(Math.random() * (99+1));
        return memeData[num].url;
    })
    .catch(err => {
        if (err) {
            return  err.message
        }
        else {
            return "Some error occurred while fetching a new meme image."
        }
    });
}

function getFiveRandomCaptions(captions) {
    let myCaptions = [];
    let indexes = [];
    for (i=0; i<5; i++) {
        let indx = Math.floor(Math.random() * 100) % (captions.length-1);
        while (indexes.find(index => index === indx)) {
            indx = Math.floor(Math.random() * 100) % (captions.length-1);
        }
        indexes.push(indx);
        myCaptions[i] = captions[indx];
    }
    return myCaptions;
}

function getRandomCaption(captions) {
    let indx = Math.floor(Math.random() * 100) % (captions.length-1);
    return captions[indx];
}

const captions = [
    'When you get fucked in your 449 final.',
    'The Comp Sci Lab.',
    'When you are frustrated with your Base Model Macbook Air.',
    'Building your own PC',
    'Remembering you are in Haskayne.',
    'When your recursion works',
    'recursion > loops',
    'Coding in bitwise operations',
    'Trying to understand what your professor is saying',
    'I am dropping out to start an Only Fans.',
    'Oh you know how to write "Hello World" and you call yourself a programmer?',
    'I enjoy long walks to Math Sciences in my free time.',
    'My back hurts from carrying my team so hard.',
    'Who needs sleep when you have coffee.',
    'Coding for 8 hours straight',
    'Giving up on Git because you have been resolving merge conflicts for 4 hours',
    'Keeeping copies of files as version control',
    'When you write a ton of code in one go and spend 8 hours debugging it',
    'Just because it compiles, doesn\'t mean it works',
    'HTML is a language',
    'When someone brags about their friend knowing HTML',
    "C code",
    "Calculating what you need to get on the final to pass the course",
    'Having a teammate as useless as a chromebook',
    'When you find out there is going to be a peer review.',
    'Merged right to Main and caused an Error.',
    'When you get a merge conflict.',
    'Copying code from stackoverflow',
    'null pointer exception',
    'When you hit compile and it works the first time',
    'When someone merges spaghetti code ',
    'When the project manager wants to use C',
    '3 billion devices run java',
    'Array indexes should start at 1',
    'Counting everything from 0',
    'When your unicard will not scan at math sciences',
    'Linux users',
    'Assembly > Prolog',
    'Academic Misconduct',
    'Closing 12 Stackoverflow tabs after solving the problem',
    'Having 50 tabs open',
    'Coding in EMacs',
    'Preferring Vim over Emacs',
    'Trying to exit Vim',
    'Look at me, I am the scrum master now.',
    'Am I dumb or am I stupid?.',
    'incrementing a loop, x++ versus x -= -1 ',
    'my spaghetti code versus my clean code',
    'git merge --force',
    'writing "Hello World" does not make you a programmer.',
    'Why is my code returning an infinite loop?',
    'Your friends Chegg Account',
    'Fork child, kill parent',
    'Fork children, kill orphans',
    'This task should take you 2 hours.',
    'And that is how you calculate 1+3',
    'Writes 10 lines of code without looking at Google.',
    'You study computer science, can you fix my printer?',
    'I hate LINUX',
    'Voting Linux for best OS',
    'Sorry babe, not tonight, I am coding.',
    'Will my program work if I re-compile?',
    'Will my program work if I restart the computer?',
    'Missing semicolon on line 331',
    'Cannot have any runtime errors if your code does not compile',
    'I hate programming, I hate programming, I love programming! YAY!',
    'Submitting an infinite loop to WebCat',
    'Print Statements are better than a debugger.',
    'The face you make when you get a segmentation fault.',
    'FORK BOMB!',
    'Only friends on social media are parents... gets cyberbullied.',
    'When you try to think recursively.',
    'When you get the same seat you picked in the first class.',
    'Art students.',
    'Needing to do a proof by induction.',
    'When turning it off and on again does not work.',
    'Trying to get that extra percent of test case coverage.',
    'Assignment due date is not until tomorrow night.',
    'Waiting for your program to compile.',
    'When people do not shut up in Zoom chat.',
    'Professor having to go over assignment rules for the fourth time.',
    'Do you need an extension?',
    'When your professor gives a last-minute extension but you already pulled an all-nighter trying to finish the assignment'
];
