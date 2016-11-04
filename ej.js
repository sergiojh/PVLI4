// By Carlos León, 2016
// Licensed under Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)

'use strict';

//////////////////////////////////////////////////////////////////////////////

// Entity type to differentiate entities and have them attack those not
// belonging to the same kind
var EntityType = {
    GOOD: 0,
    EVIL: 1
};

// Entity constructor
// 
// Entities have a name (it doesn't have to be unique, but it helps) and a type
//
// Additionally, entities accept a list of instantiated components
function Entity(entityName, entityType, components) {
    var self = this;
    var dormido=false;
    this.dormido=false;
    this.entityName = entityName;

    // Instead of assigning the parameter, we call `addComponent`, which is a
    // bit smarter than default assignment
    this.components = [];
    components.forEach(function(component) {
        self.addComponent(component);
    });
    this.type = entityType;
}

Entity.prototype.addComponent = function(component) {
    this.components.push(component);
    component.entity = this;
};

// This function delegates the tick on the components, gathering their messages
// and aggregating them into a single list of messages to be delivered by the
// message manager (the game itself in this case
Entity.prototype.tick = function() {
    var outcoming = [];

   
    this.components.forEach(function(component) {
        var messages = component.tick();
        messages.forEach(function (message) {
            outcoming.push(message);
        });
    });
    if(this.dormido==false){
     outcoming.push(new Presence(this));
    }
    return outcoming;
};

// All received messages are forwarded to the components
Entity.prototype.receive = function(message) {
    // If the receiver is `null`, this is a broadcast message that must be
    // accepted by all entities
    if(!message.receiver || message.receiver === this) {
        this.components.forEach(function(component) {
            component.receive(message);
        });
    }
};
//////////////////////////////////////////////////////////////////////////////
// if the receiver is null, it is a broadcast message
function Message(receiver) {
    this.receiver = receiver;
}

//////////////////////////////////////////////////////////////////////////////
function Component(entity) {
    this.entity = entity;
    this.messageQueue = [];
}
//Lo modificamos para que solo reciva mensajes si no está dormido
Component.prototype.tick = function() {
    // We return a copy of the `messageQueue`, and we empty it
    
    var aux = this.messageQueue;
    this.messageQueue = [];
    if (this.dormido===false)
        {
              var aux = this.messageQueue;
    
        }
        return aux;
        /*var aux = [];
   
    if (this.dormido===true)
        {
             
        aux = this.messageQueue;
        }
        this.messageQueue = [];
        return aux;
};*/
};
Component.prototype.receive = function(message) {

};


//////////////////////////////////////////////////////////////////////////////

function Game(entities) {
    this.entities = entities;
    this.messageQueue = [];
}

Game.prototype.mainLoop = function (ticks) {
    var i = 0;
    function line() {
        console.log("-----------------------------------------");
    }
    while(!ticks || i < ticks) {
        line();
        console.log("Tick number " + i);
        line();
        this.tick();
        i++;
    }
};

// Each tick, all entities are notified by calling their `tick` function
Game.prototype.tick = function () {
    var self = this;

    

    // All messages coming from the entities are put in the queue
    this.entities.forEach(function(entity) {
        var tickMessages = entity.tick();

        tickMessages.forEach(function(tickMessage) {
            self.messageQueue.push(tickMessage);
        });
    });

    this.deliver();
};


// All messages in the queue are delivered to all the entities
Game.prototype.deliver = function() {
    var self = this;

    this.messageQueue.forEach(function(message) {
        if(!message.receiver) {         
            self.entities.forEach(function(entity) {
                entity.receive(message);
            });
        }
        else {
            message.receiver.receive(message);
        }
    });

    this.messageQueue = [];
};

//////////////////////////////////////////////////////////////////////////////
// Components
//////////////////////////////////////////////////////////////////////////////
function Attacker(entity) {
    Component.call(this, entity);
}
Attacker.prototype = Object.create(Component.prototype);
Attacker.prototype.constructor = Attacker;

Attacker.prototype.receive = function(message) {
    if(message instanceof Presence) {
        if(message.who.type != this.entity.type) {
            this.messageQueue.push(new Attack(this.entity, message.who));

    }

        
    }
};

//////////////////////////////////////////////////////////////////////////////
function Defender(entity) {
    Component.call(this, entity);
}
Defender.prototype = Object.create(Component.prototype);
Defender.prototype.constructor = Defender;

Defender.prototype.receive = function(message) {
    if(message instanceof Attack) {
        console.log(this.entity.entityName + " was attacked by " + message.who.entityName);
    }
};
//////////////////////////////////////////////////////////////////////////////
//Mensaje que da la capacidad de tener vida y poder ser "curados"
function Vida(entity) {
    Component.call(this, entity);
    this.vida= 100;
}
Vida.prototype = Object.create(Component.prototype);
Vida.prototype.constructor = Vida;

Vida.prototype.receive = function(message) {
    if(message instanceof Curar) {
        this.vida+=15;
        console.log(this.entity.entityName + " was healed " );
    }
};
////////////////////////////////////////////////////////////////////////////////////////////////
// Componente que lanzan un mensaje de curar a las unidades de su mismo bando
function Curandero(entity) {
    Component.call(this, entity);
}
Curandero.prototype = Object.create(Component.prototype);
Curandero.prototype.constructor = Curandero;

Curandero.prototype.receive = function(message) {
    if(message instanceof Presence) {
        if(message.who.type == this.entity.type) {
            this.messageQueue.push(new Curar(this.entity, message.who));
        }
    }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////
//COoponente que hace que si una entidad lo tiene se despierta o se duerme en el caso de recibir el correspondiente mensaje
//en está practica como no pedia implementarlo en la jugabilidad no hemos creado ningun componente que tenga el "hechizo"
// de dormir o despertar
function Dormidor(entity) {
    Component.call(this, entity);
}
Dormidor.prototype = Object.create(Component.prototype);
Dormidor.prototype.constructor = Dormidor;

Dormidor.prototype.receive = function(message) {
    if(message instanceof Sleep) {
         console.log(this.entity.entityName + " se ha dormido " );
            this.entity.dormido=true;
        }
    if(message instanceof WakeUp) {
        console.log(this.entity.entityName + " se ha despertado " );
            this.entity.dormido=false;
        }
};
///////////////////////////////////////////////////////////////////////////////
function Volumen(entity) {
    Component.call(this, entity);
}
Volumen.prototype = Object.create(Component.prototype);
Volumen.prototype.constructor = Volumen;

Volumen.prototype.receive = function(message) {
    if(message instanceof Presence && message.who === this.entity) {
        console.log(this.entity.entityName + " me estoy moviendo " );
    }
};
//////////////////////////////////////////////////////////////////////////////
function Mover(entity) {
    Component.call(this, entity);
}
Mover.prototype = Object.create(Component.prototype);
Mover.prototype.constructor = Mover;

Mover.prototype.receive = function(message) {
    if(message instanceof Presence && message.who === this.entity) {
        console.log(this.entity.entityName + " tengo volumen " );
    }
};



//////////////////////////////////////////////////////////////////////////////
// Messages
//////////////////////////////////////////////////////////////////////////////
function Presence(who, receiver) {
    Message.call(this, receiver);
    this.who = who;
}
Presence.prototype = Object.create(Message.prototype);
Presence.prototype.constructor = Presence;
//////////////////////////////////////////////////////////////////////////////
function Attack(who, receiver) {
    Message.call(this, receiver);
    this.who = who;
}
Attack.prototype = Object.create(Message.prototype);
Attack.prototype.constructor = Attack;


function Sleep(who, receiver) {
    Message.call(this, receiver);
    this.who = who;
}
Sleep.prototype = Object.create(Message.prototype);
Sleep.prototype.constructor = Sleep;


function WakeUp(receiver) {
    Message.call(this, receiver);
    this.who = who;
  //reciever.dormido=false;
}
WakeUp.prototype = Object.create(Message.prototype);
WakeUp.prototype.constructor = WakeUp;

function Curar(who, receiver) {
    Message.call(this, receiver);
    this.who = who;
}
Curar.prototype = Object.create(Message.prototype);
Curar.prototype.constructor = Curar;

//////////////////////////////////////////////////////////////////////////////



// helper functions creating new components
var attacker = function() { return new Attacker(); };
var defender = function() { return new Defender(); };
var vida = function() { return new Vida(); };
var curandero = function() { return new Curandero(); };
var dormidor = function() { return new Dormidor(); };
var volumen = function() { return new Volumen(); };
var mover = function() { return new Mover(); };

// entities in the game
var link = new Entity("link", EntityType.GOOD, [attacker(), defender()]);
var ganon = new Entity("ganon", EntityType.EVIL, [attacker(), defender(),vida(),curandero()]);
var octorok = new Entity("octorok", EntityType.EVIL, [defender(),vida()]);
var armos = new Entity("armos", EntityType.EVIL, [attacker()]);
var voluminillo = new Entity("voluminillo", EntityType.EVIL, [volumen()]);
var usain = new Entity("usain", EntityType.EVIL, [mover()]);
var fede = new Entity("fede", EntityType.EVIL, [volumen(),mover()]);

// we create the game with the entities
var game = new Game([link, ganon, armos, octorok,voluminillo,usain,fede]);

game.mainLoop(10);
//La jerarquía de clases que se nos ocurre es:
//Puede contener desde 0 a todos los componentes
//1.entidad 1.1 Volumen
//           1.2 Se mueve
//           1.3 Se mueve y volumen
