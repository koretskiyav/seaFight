$.put = function(url, data, callback, type){

  if ( $.isFunction(data) ){
    type = type || callback,
    callback = data,
    data = {}
  }

  return $.ajax({
    url: url,
    type: 'PUT',
    success: callback,
    data: data,
    contentType: type
  });
}

var mountNode = document.getElementById('content');

var GlobalDiv = React.createClass({

  getInitialState: function() {
    return {
      status: 'start',
      user: null,
      myOldGames: [],
      myCreatetGames:[],
      freeJoinGames: []
    };
  },

  render: function() {
    if (this.state.status === 'start') {
        return <StartGame />
    }
  }
});

var GameList = React.createClass({

  waitGame: function(game) {
    var wait = setInterval(function() {
        $.get('../game/' + game)
          .done(function(data) {
            if (data.status === 'OK') {
              console.log('GO!');
              clearInterval(wait);
            }
          });
    }, 1000);
  },

  handleClick: function(index) {
    $.put('../users/' + this.props.user + '/game/' + this.props.games[index].id)
      .done(function(data) {
        this.waitGame(this.props.games[index].id);
      }.bind(this));
  },

  render: function() {
    var liNodes = this.props.games.map(function(game, index) {
      return (
        <li onClick={this.handleClick.bind(this, index)}>{game}</li>
      )
    }.bind(this));
    return <ul>{liNodes}</ul>;
  }
});

var StartGame = React.createClass({

  getInitialState: function() {
    return {
      user: null,
      myOldGames: [],
      myCreatetGames:[],
      freeJoinGames: []
    };
  },

  onChange: function( e ) {
    this.setState({user: e.target.value});
  },

  handleSubmit: function( e ) {
    e.preventDefault();
    $.get('../users/' + this.state.user)
      .done(function(data) {
        this.setState({
          myOldGames : data.Games.myOldGames,
          myCreatetGames : data.Games.myCreatetGames,
          freeJoinGames : data.Games.freeJoinGames
        });
      }.bind(this));
  },

  createNewGame: function() {
    $.post('../users/' + this.state.user)
      .done(function(data) {
        this.state.myCreatetGames.push(data.game);
        this.setState(this.state);
      }.bind(this));
  },

  render: function() {
    return (
      <div>
        <form onSubmit={this.handleSubmit}>
          <p>Enter your name:</p>
          <input onChange={this.onChange} value={this.state.text} />
          <button>Go!</button>
        </form>
        <div>
          <button onClick={this.createNewGame}>Create new game</button>
          {this.state.myOldGames !== [] ?
            <div>
              <h4>You have not completed the games:</h4>
              <GameList games={this.state.myOldGames} user={this.state.user} />
            </div>
            : null
          }
          {this.state.myCreatetGames !== [] ?
            <div>
              <h4>You have not completed the games:</h4>
              <GameList games={this.state.myCreatetGames} user={this.state.user} />
            </div>
            : null
          }
          {this.state.freeJoinGames !== [] ?
            <div>
              <h4>You have not completed the games:</h4>
              <GameList games={this.state.freeJoinGames} user={this.state.user} />
            </div>
            : null
          }
        </div>
      </div>
    );
  }
});

var Cell = React.createClass({
  handleClick: function(e) {
    if (this.props.onClick) this.props.onClick(e);
  },

  render: function() {
    return (
      <div className={this.props.status} onClick={this.handleClick}></div>
    );
  }
});

var Field = React.createClass({

  getInitialState : function() {
  var data = [];

  for (var i = 0; i < 100; i++) {
      data.push({ 'status': 'void' });
  };
    return {value: data};
  },

  handleCellClick: function(i, e) {
    // $.get('../users/' + this.state.value.indexOf(i))
    //   .done(function(data) {
    //     console.log(data);
    //   });
    var curCell = this.state.value[this.state.value.indexOf(i)];
    curCell.status = curCell.status === 'ship' ? 'void' : 'ship';
    this.setState(this.state.value);
  },

  render: function() {
    var cellNodes = this.state.value.map(function(item, index) {
      return (
        <Cell status={item.status} onClick={this.handleCellClick.bind(this, item)}/>
      );
    }.bind(this));

    return (
      <div className="field">
        {cellNodes}
      </div>
    );
  }
});

React.render(<GlobalDiv />, mountNode);