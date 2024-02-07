module.exports = (sequelize, DataTypes) => {
  const Invite = sequelize.define("Invite", {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  });

  Invite.associate = (models) => {
    Invite.belongsTo(models.User, {
      foreignKey: "createdBy",
      onDelete: "CASCADE",
    });
  };

  // Invite.sync({ force: true });

  return Invite;
};
