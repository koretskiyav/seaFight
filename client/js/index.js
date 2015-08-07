var mountNode = document.getElementById('content');

var GlobalDiv = React.createClass({

    getInitialState: function() {
        return {
            user: '',
            game: '',
            games: [],
        };
    },

    getGameList: function(user) {
        this.setState({user: user});
        $.get('../users/' + user)
            .done(function(data) {
                this.setState({games : data.games});
            }.bind(this));
    },

    createNewGame: function() {
        $.post('../users/' + this.state.user)
            .done(function(data) {
                this.setState({game: data.game});
                if (this.state.game.status === 'wait2nd') this.waitGame();
            }.bind(this));
    },

    chooseGame: function(index) {
        $.post('../users/' + this.state.user + '/game/' + this.state.games[index].id)
            .done(function(data) {
                this.setState({game: data.game});
                if (this.state.game.status === 'wait2nd') this.waitGame();
            }.bind(this));
    },

    waitGame: function() {
        var wait = setInterval(function() {
            $.get('../game/' + this.state.game.id + '/users/' + this.state.user)
                .done(function(data) {
                    this.setState({game: data.game});
                    if (this.state.game.status !== 'wait2nd') clearInterval(wait);
                    if (this.state.game.status === 'fight') this.waitMyMove();
                }.bind(this));
        }.bind(this), 1000);
    },

    putShip: function(index) {

        if (this.state.game.status === 'placement') {
            this.state.game.myField[index] = 'wait';
        } else {
            this.state.game.enemyField[index] = 'wait';
        }

        this.setState({game: this.state.game});

        $.post('../users/' + this.state.user + '/game/' + this.state.game.id + '/place/' + index)
            .done(function(data) {
                this.setState({game: data.game});
                if (this.state.game.status === 'fight') this.waitMyMove();
            }.bind(this));
      },

    readyToFightClick: function() {
        $.get('../users/' + this.state.user + '/game/' + this.state.game.id)
            .done(function(data) {
                this.setState({game: data.game});
                if (data.game.status === 'wait2nd') this.waitGame();
                if (this.state.game.status === 'fight') this.waitMyMove();
            }.bind(this));
    },

    waitMyMove: function() {
        var wait = setInterval(function() {
            $.get('../game/' + this.state.game.id + '/users/' + this.state.user)
                .done(function(data) {
                    this.setState({game: data.game});
                    if (this.state.game.curMove === 'me') clearInterval(wait);
                }.bind(this));
        }.bind(this), 1000);
    },

    render: function() {
        if (!this.state.game || !this.state.game.status) {
            return <StartGame games          = {this.state.games}
                              haveName       = {!!this.state.user}
                              getGameList    = {this.getGameList}
                              createNewGame  = {this.createNewGame}
                              chooseGame     = {this.chooseGame}/>
        } else if (this.state.game.status === 'wait2nd') {
            return <div className="GlobalDiv">Waiting 2nd player...</div>
        } else if (this.state.game.status === 'placement') {
            return <ShipsPlacement ships         = {this.state.game.myField}
                                   onFieldClick  = {this.putShip}
                                   readyToFight  = {this.readyToFightClick}
                                   myErr         = {this.state.game.myErr} />
        } else if (this.state.game.status === 'fight') {
            return <BattleField myField       = {this.state.game.myField}
                                enemyField    = {this.state.game.enemyField}
                                onFieldClick  = {this.putShip}
                                myErr         = {this.state.game.myErr} />
        }
    }
});

React.render(<GlobalDiv />, mountNode);